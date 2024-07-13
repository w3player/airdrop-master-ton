trait AidropUtils {
    fun sendJetton(queryId: Int, jettonWalletAddress: Address, to: Address, amount: Int) {
        // get contract's jetton wallet address
        // let init: StateInit = initOf JettonDefaultWallet(jettonMasterAddress, myAddress());
        // let jettonWalletAddress: Address = contractAddress(init);
        // send jetton
        let params: SendParameters = SendParameters{
            to: jettonWalletAddress,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TokenTransfer{
                queryId: queryId,
                amount: amount,
                destination: to,
                response_destination: to,
                custom_payload: null,
                forward_ton_amount: 0,
                forward_payload: emptyCell().asSlice()
            }.toCell()
        };
        send(params);
    }
}