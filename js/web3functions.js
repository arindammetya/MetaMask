//Arindam Metya
//This Js is responsible for all web3 functions

var account;
var requiredChainId;
var selectedCoin;


//<!-- For Desktop Metamask Wallet -->

var detectMetamask = async () => {


  // this returns the provider, or null if it wasn't detected
  const metamaskDesktopWallet = await detectEthereumProvider();

  if (metamaskDesktopWallet) {
    startApp(metamaskDesktopWallet); // Initialize your app
  }

  function startApp(provider) {
    // If the provider returned by detectEthereumProvider is not the same as
    // window.ethereum, something is overwriting it, perhaps another wallet.
    if (metamaskDesktopWallet !== window.ethereum) {
      console.error('Do you have multiple wallets installed?');
    }else{

      document.getElementById("metamaskButton").style.display = "block";

      // ethereum.on("accountsChanged", async ( accounts ) => {
      //   console.log(accounts);

      //   account = accounts[0];

      //   //await balance(account);

      // });


      // ethereum.on("chainChanged", async (chainId) => {

      //   //changeNetwork (chainId , requiredChainId);

      //   console.log(parseInt(chainId, 16));
      //   //console.log(chainId);
      //   //console.log(await balance(account)); //add a time out before call this function
      // });


      // ethereum.on("disconnect", async (code, reason) => {
      //   console.log(code, reason);
      // });
      

    }
    // Access the decentralized web!
  }


}



var connectMetamask = async () => {

      try{

        $('#loading-indicator').show();
        $('#paymentModel').hide();

        provider = ethereum;

        const web3 = new Web3(provider);
        window.w3 = web3

        var accounts = await provider.request({ method: 'eth_requestAccounts' });
        account = accounts[0];

        let defaultChainId = await web3.eth.getChainId();
        console.log(account);
        console.log(provider);
        console.log('chainID', defaultChainId);

        await changeNetwork (defaultChainId , requiredChainId).then(async res=>{

          console.log('resr', res);
            await sendTransactionRequest( account, walletAddress, metaAmount).then(async transactionReport =>{

                if (transactionReport.status && transactionReport.transactionHash != '') {

                  //process order
                  prepareDataAndSubmitForOfllineOrderWithCryptoPayment(transactionReport , selectedCoin);

                }


            });

        });

        

        



      }catch(err){

          let errors = [];
          
          errors.push((err.message ? err.message : 'Unable to connect with your wllet! Please try again!'));
          $('#loading-indicator').hide();
          cb.errorHandler(errors);
          await provider.disconnect()
          console.log(err);
      }
        
}
        




    


//<!-- For Desktop Metamask Wallet -->



    // https://docs.walletconnect.com/quick-start/dapps/web3-provider
var provider = new WalletConnectProvider.default({
  //infuraId: "be45455659fac1c545dec657f05951eb",
  qrcodeModalOptions: {
     mobileLinks: [
       "rainbow",
       "metamask",
     ],
     desktopLinks: [
      'metamask'
      ],
   },
  rpc: {
    0x1: "https://cloudflare-eth.com/", 
    0x38: "https://bsc-dataseed.binance.org/",
    0x89: "https://polygon-rpc.com/",
    0x3: "https://rpc.ankr.com/eth_ropsten",
    0x61: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    0x13881: "https://matic-mumbai.chainstacklabs.com"
  },
  // bridge: 'https://bridge.walletconnect.org',
});

  

var connectWC = async () => {


  try{

      $('#loading-indicator').show();
      $('#paymentModel').hide();
      await provider.enable();

      //  Create Web3 instance
      const web3 = new Web3(provider);
      window.w3 = web3


      var accounts  = await web3.eth.getAccounts(); // get all connected accounts
      account = accounts[0]; // get the primary account
      let defaultChainId = await web3.eth.getChainId();
      console.log(account);

      console.log('wallet_name', provider.wc._peerMeta.name);

      console.log('chainID', defaultChainId);

      await changeNetwork (defaultChainId , requiredChainId).then(async res=>{

        console.log('resr', res);
          await sendTransactionRequest( account, walletAddress, metaAmount).then(async transactionReport =>{

              if (transactionReport.status && transactionReport.transactionHash != '') {

                //process order
                  prepareDataAndSubmitForOfllineOrderWithCryptoPayment(transactionReport , selectedCoin);
              }

              //console.log(transactionReport);

          });

      });
      

      

  }catch(err){

        let errors = [];
        
        errors.push((err.message ? err.message : 'Unable to connect with your wallet! Please try again!'));
        $('#loading-indicator').hide();
        cb.errorHandler(errors);
        await provider.disconnect()
        console.log(err);

        if (err.message == 'User closed modal') {

           location.reload();
        }
        
    }
}

var changeNetwork = async (defaultChainId , requiredChainId) =>{


      return new Promise((resolve, reject) => {

          if ( defaultChainId != requiredChainId ) {


              provider.request({
                             method: 'wallet_switchEthereumChain', 
                             params: [{ chainId: w3.utils.toHex(requiredChainId) }]
                           }).then(result =>{

                            resolve('sucess');

                           }).catch(err => {

                            if (err.message === 'JSON RPC response format is invalid') {

                              resolve('sucess');

                            }else if(err.message.match(/Try adding the chain using wallet_addEthereumChain first/i)){

                              reject({mesage: 'The network required for '+ selectedCoin + ' is not added on your wallet. Please add and try!'});

                            }else{

                              reject(err);
                            }
                            

                           });

          }else{

            resolve('sucess');
          }



      });

}
  

var sign = async (msg) => {
  if (w3) {
    return await w3.eth.personal.sign(msg, account)
  } else {
    return false
  }
}

var balance = async (fromAddress) => {
  if (w3) {
    return await w3.eth.getBalance(fromAddress)
  } else {
    return false
  }
}

var contract = async (abi, address) => {
  if (w3) {
    return new w3.eth.Contract(abi, address)
  } else {
    return false
  }
}

var sendTransactionRequest = async (fromAddress, toAddress, amount) => {

  return new Promise((resolve, reject) => {


      if (w3) {

        currencyConverter(amount).then(async res => {
          
          let wei = await w3.utils.toWei(res[selectedCoin], 'ether');

          console.log(wei);

          w3.eth.sendTransaction({from: fromAddress, to: toAddress , value: wei  })
          .on('transactionHash', function(hash){
            console.log('transactionHash',hash);
          })
          .on('receipt', function(receipt){
             resolve(receipt);
          })
          .on('error', function(err){

              console.error('onerr', err);
              if (err.message.match(/Internal JSON-RPC error/i)) {

                reject({mesage: 'Please ensure that you have enough native tokens to complete the payment!'});

              }else{

                  reject(err);
              }
              
          });



        }).catch(err => {

          reject('Provider is not connected!');
          console.log('err' , err);
        });

        
      } else {
          
          reject('Provider is not connected!');

      }

  });

}


var signTransactionRequest = async (receiverAddress , senderAddress, amount) => {
  if (w3) {
    return new w3.eth.signTransaction({from: receiverAddress, to: senderAddress , value: amount  });
  } else {
    return false
  }
}


var disconnect = async () => {
  // Close provider session
  await provider.disconnect()
}



function currencyConverter(amount) {
  var xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status === 200) {
        //console.log('SUCCESS', xhr.responseText);

        var data = JSON.parse(xhr.responseText)
        //console.log(data)
        
        //converting amaont to the equlivalent coins
        let ETH_amount = (amount * data.USD.ETH).toFixed(4);
        let MATIC_amount = (amount * data.USD.MATIC).toFixed(4);
        let BNB_amount = (amount * data.USD.BNB).toFixed(4);

        //converting Matic and BNB to equivalnt ETH (because the we need to pass the equivalint ether on the send tranaction method)

        // let MATIC_ETH_amount = (MATIC_amount * data.MATIC.ETH).toFixed(4) ;
        // let BNB_ETH_amount = (BNB_amount * data.BNB.ETH).toFixed(4);





        let obj = {
            ETH:  ETH_amount,
            MATIC: MATIC_amount,
            BNB: BNB_amount,
          };


        resolve(obj);

      } else {
        reject('currency converter error');
      }
    };

    xhr.open('GET', 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=USD,MATIC,BNB&tsyms=ETH,MATIC,BNB');
    xhr.send();
  });
}

const chainDetails = {

  ETH: {

    net: 1,
    testNet: 3

  },
  MATIC: {

    net: 137,
    testNet: 80001

  },
  BNB: {

    net: 56,
    testNet: 97

  }

}

