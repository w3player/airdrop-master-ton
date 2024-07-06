import { Address } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import { NetworkProvider } from '@ton/blueprint';
import { demoData } from './00_demoData';

export async function run(provider: NetworkProvider) {
    const airdropMaster = provider.open(AirdropMaster.fromAddress(Address.parse(demoData.airdropContract)));

    const [settings, balance, owner, stopped, version] = await Promise.all([
        airdropMaster.getAirdropSettings(),
        airdropMaster.getBalance(),
        airdropMaster.getOwner(),
        airdropMaster.getStopped(),
        airdropMaster.getVersion(),
    ]);

    const data = {
        settings,
        balance,
        owner,
        stopped,
        version,
    };

    console.log(data);

    const myTokenWalletAddress = await airdropMaster.getMyTokenWalletAddress();
    console.log(myTokenWalletAddress);
}
