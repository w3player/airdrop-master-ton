import { Address, toNano } from '@ton/core';
import { TonClient, JettonMaster } from '@ton/ton';
import TonWeb from 'tonweb';
import { NetworkProvider } from '@ton/blueprint';
import { demoData } from './00_demoData';
import { mnemonicToKeyPair } from 'tonweb-mnemonic';

const endpointMap = {
    testnet: 'https://testnet.toncenter.com/api/v2/jsonRPC', // 'https://testnet-v4.tonhubapi.com',
    mainnet: 'https://toncenter.com/api/v2/jsonRPC', // 'https://mainnet-v4.tonhubapi.com',
};

export async function run(provider: NetworkProvider) {
    const env = provider.network() as 'mainnet' | 'testnet';

    // 1. 计算出发起者的钱包地址
    const client = new TonClient({
        endpoint: endpointMap[env],
    });
    const jettonMasterAddress = Address.parse(demoData.jetton);
    const jettonMaster = client.open(JettonMaster.create(jettonMasterAddress));
    const myJettonWalletAddress = await jettonMaster.getWalletAddress(provider.sender().address!);

    // 2. 构造交易
    const url =
        env === 'mainnet' ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC';
    const tonweb = new TonWeb(new TonWeb.HttpProvider(url, {}));
    const toAddress = new TonWeb.Address(demoData.airdropContract);

    const forwardPayload = new TonWeb.boc.Cell();
    forwardPayload.bits.writeUint(0, 32); // 0 opcode 意味着我们有一个评论
    forwardPayload.bits.writeString('tansfer jetton');

    /*
        Tonweb 有一个内置的用于与 jettons 互动的类(class)，它有一个创建转账的方法。
        然而，它有缺点，所以我们手动创建消息体。此外，这种方式让我们更好地理解了
        存储的内容和它的功能是什么。
     */
    const jettonTransferBody = new TonWeb.boc.Cell();
    jettonTransferBody.bits.writeUint(0xf8a7ea5, 32); // jetton 转账的 opcode
    jettonTransferBody.bits.writeUint(0, 64); // query id
    jettonTransferBody.bits.writeCoins(new TonWeb.utils.BN(2 * 10 ** 9)); // jetton 数量，数量 * 10^9
    jettonTransferBody.bits.writeAddress(toAddress);
    jettonTransferBody.bits.writeAddress(toAddress); // 响应目的地
    jettonTransferBody.bits.writeBit(false); // 无自定义有效载荷
    jettonTransferBody.bits.writeCoins(TonWeb.utils.toNano('0.02')); // 转发金额
    jettonTransferBody.bits.writeBit(true); // 我们将 forwardPayload 作为引用存储
    jettonTransferBody.refs.push(forwardPayload);

    const keyPair = await mnemonicToKeyPair((process.env as any).WALLET_MNEMONIC.split(' '));

    const wallet = new tonweb.wallet.all['v4R2'](tonweb.provider, {
        publicKey: keyPair.publicKey,
        wc: 0, // 工作链
    });

    await wallet.methods
        .transfer({
            secretKey: keyPair.secretKey,
            toAddress: myJettonWalletAddress.toString()!,
            amount: tonweb.utils.toNano('0.1'),
            seqno: (await wallet.methods.seqno().call())!,
            payload: jettonTransferBody,
            sendMode: 3,
        })
        .send(); // 创建转账并发送
}
