import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import '@ton/test-utils';

describe('AirdropMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let airdropMaster: SandboxContract<AirdropMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        airdropMaster = blockchain.openContract(await AirdropMaster.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await airdropMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: airdropMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and airdropMaster are ready to use
    });
});
