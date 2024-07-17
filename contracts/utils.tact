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
                forward_payload: emptySlice()
            }.toCell()
        };
        send(params);
    }
}
message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}