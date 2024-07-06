import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/airdrop_master.tact',
    options: {
        debug: true,
    },
};
