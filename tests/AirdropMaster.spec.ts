import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, SendMode, toNano } from '@ton/core';
import { AirdropMaster } from '../wrappers/AirdropMaster';
import '@ton/test-utils';
import { buildMerkleTree, getClaimProof } from './helper';

describe('AidropMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let aidropMaster: SandboxContract<AirdropMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        aidropMaster = blockchain.openContract(await AirdropMaster.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await aidropMaster.send(
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
            to: aidropMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and aidropMaster are ready to use
    });

    it('should stop and resume contract', async () => {
        //  stop contract
        await aidropMaster.send(deployer.getSender(), { value: toNano('0.05') }, 'Stop');
        expect(await aidropMaster.getStopped()).toBe(true);

        await aidropMaster.send(deployer.getSender(), { value: toNano('0.05') }, 'Resume');
        expect(await aidropMaster.getStopped()).toBe(false);
    });

    it('should set base params ok', async () => {
        const setBaseParamsResult = await aidropMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetBaseParams',
                args: {
                    $$type: 'AirdropSettings',
                    tokenWallatAddress: null,
                    startTime: BigInt(0),
                    endTime: 0n,
                    merkleRoot: 0n,
                },
            },
        );

        // check contract version
        expect(await aidropMaster.getVersion()).toEqual('1.0.0');
        expect(await aidropMaster.getStopped()).toEqual(true);
        const owner = await aidropMaster.getOwner();
        expect(owner.equals(deployer.address)).toBe(true);

        // check that the transaction was successful
        expect(setBaseParamsResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: aidropMaster.address,
            success: true,
        });

        // test airdrop settings
        const settings = await aidropMaster.getAirdropSettings();
        expect(settings.tokenWallatAddress).toBe(null);
        expect(settings.startTime).toEqual(BigInt(0));
        expect(settings.endTime).toEqual(0n);
        expect(settings.merkleRoot).toEqual(0n);
    });

    it('should throw error if not owner', async () => {
        const deployer2 = await blockchain.treasury('deployer2');

        await aidropMaster.send(
            deployer2.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetBaseParams',
                args: {
                    $$type: 'AirdropSettings',
                    tokenWallatAddress: deployer.address,
                    startTime: BigInt(0),
                    endTime: 10n,
                    merkleRoot: 0n,
                },
            },
        );

        // check edit not work
        const settings = await aidropMaster.getAirdropSettings();
        expect(settings.endTime).toBe(0n);
    });

    it('deposite and withdraw', async () => {
        const balance = await aidropMaster.getBalance();
        expect(balance).toEqual(0n);

        await deployer.send({ to: aidropMaster.address, value: toNano('1'), sendMode: SendMode.PAY_GAS_SEPARATELY });
        await deployer.send({ to: aidropMaster.address, value: toNano('1') });
        const newBalance = await aidropMaster.getBalance();
        expect(newBalance > toNano('1') && newBalance < toNano('2')).toBe(true);

        // withdraw
        await aidropMaster.send(deployer.getSender(), { value: toNano('5') }, 'withdraw');
        const latestBalance = await aidropMaster.getBalance();
        console.log(`latestBalance: ${latestBalance}`);

        expect(latestBalance).toEqual(0n);
    });

    it('merkle proof verify', async () => {
        const merkleTreeResult = buildMerkleTree();

        // set params
        await aidropMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetBaseParams',
                args: {
                    $$type: 'AirdropSettings',
                    tokenWallatAddress: null,
                    startTime: BigInt(0),
                    endTime: 0n,
                    merkleRoot: merkleTreeResult.merkleRoot,
                },
            },
        );

        const result = getClaimProof(merkleTreeResult.dictCellBoc, 1);
        // test airdrop settings
        const claimEntry = await aidropMaster.getCheckProof(Cell.fromBase64(result.proofBoc), 1n);

        // dict.set(1n, {
        //     index: 1,
        //     address: Address.parse('EQD4eA1SdQOivBbTczzElFmfiKu4SXNL4S29TReQwzzr_70k'),
        //     claimableAmount: 2000n,
        //     claimableTimestamp: 1720074084,
        // });

        expect(claimEntry.address.equals(Address.parse('EQD4eA1SdQOivBbTczzElFmfiKu4SXNL4S29TReQwzzr_70k'))).toBe(true);
        expect(claimEntry.claimableAmount).toBe(2000n);
        expect(claimEntry.claimableTimestamp).toBe(1720074084n);
        expect(claimEntry.index).toBe(1n);
    });

    it('error proof will throw error', async () => {
        const merkleTreeResult = buildMerkleTree();

        // set params
        await aidropMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetBaseParams',
                args: {
                    $$type: 'AirdropSettings',
                    tokenWallatAddress: null,
                    startTime: BigInt(0),
                    endTime: 0n,
                    merkleRoot: merkleTreeResult.merkleRoot,
                },
            },
        );

        expect(async () => {
            const result = getClaimProof(merkleTreeResult.dictCellBoc, 3);
            await aidropMaster.getCheckProof(Cell.fromBase64(result.proofBoc), 3n);
        }).rejects.toThrow('Unable to execute get method. Got exit_code: 404');
    });

    it('claim', async () => {
        const merkleTreeResult = buildMerkleTree();
        // set params
        await aidropMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetBaseParams',
                args: {
                    $$type: 'AirdropSettings',
                    tokenWallatAddress: null,
                    startTime: BigInt(0),
                    endTime: 0n,
                    merkleRoot: merkleTreeResult.merkleRoot,
                },
            },
        );

        const claimEntry = getClaimProof(merkleTreeResult.dictCellBoc, 1);

        const claimResult = await aidropMaster.send(
            deployer.getSender(),
            { value: toNano('0.5') },
            {
                $$type: 'Claim',
                queryId: 0n,
                index: BigInt(claimEntry.index),
                proof: Cell.fromBase64(claimEntry.proofBoc),
            },
        );

        console.log(claimResult.events, claimResult.transactions);
    });
});
