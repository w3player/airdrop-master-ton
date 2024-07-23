import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TransferContract } from '../wrappers/TransferContract';
import '@ton/test-utils';

describe('AidropMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let transferContract: SandboxContract<TransferContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        transferContract = blockchain.openContract(await TransferContract.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await transferContract.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: transferContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and aidropMaster are ready to use
    });

    it('send', async () => {
        // set params
        await transferContract.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Send',
                queryId: 0n,
                amount: toNano('0.9'),
                to: deployer.address,
                message: 'ok',
            },
        );
    });
});
