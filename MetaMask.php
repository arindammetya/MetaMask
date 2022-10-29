<?php

/**
 * Author: Arindam Metya
 * This is an required file. All the function written here
 */

namespace Extension\MetaMask;

use Application\CrmPayload;
use Application\CrmResponse;
use Application\Helper\Provider;
use Application\Request;
use Application\Response;
use Application\Session;
use Application\Model\Configuration;
use Application\Model\Konnektive;
use Application\Config;
use Application\Controller\CrmsController;
use Symfony\Component\PropertyAccess\PropertyAccess;
use Application\Model\Campaign;
use Application\Helper;
use Application\Http;

class MetaMask
{
    public $walletAddress, $testNet = false; 

    public function __construct()
    {
        $this->currentStepId = (int) Session::get('steps.current.id');
        $this->pageType = Session::get('steps.current.pageType');
        $this->metamaskConfiguration = Config::extensionsConfig('MetaMask');
        $this->crmType = Session::get('crmType');
        $this->accessor = PropertyAccess::createPropertyAccessor();
        $configId   = (($this->pageType == 'thankyouPage')?(int) Session::get('steps.1.configId'):(int) Session::get('steps.current.configId'));
        $this->configuration = new Configuration($configId);
        $this->crmId   = $this->configuration->getCrmId();
        $this->crmDetails = Config::crms();


        if($this->metamaskConfiguration['receiver_wallet_address'])
        {
            $this->walletAddress = $this->metamaskConfiguration['receiver_wallet_address'];
        } 


        $this->testNet = $this->metamaskConfiguration['enable_test_nets'];


        
    }
    
    public function updateMethod()
    {
        if (
            Request::attributes()->get('action') === 'prospect'
        ) {
            return;
        }
        $formPostDate = Request::form()->all();
        if($formPostDate['cardType'] != 'Crypto')
        {
            return;
        }


        
        Session::set('extensions.metamask.step'.$this->currentStepId, $formPostDate['transactionReport'] );

        $isDynamic = false;
        if(array_key_exists('campaigns', $formPostDate))  {
            $isDynamic = true;
        }

        if(!$isDynamic) {
            $postCampaignInfo = Campaign::find($this->getCampaignID(), true);
            CrmPayload::update(array(                    
                'products' => $postCampaignInfo,
                'campaignId' => $postCampaignInfo[0]['campaignId'],
            ));
        }





        if(Session::get('crmType') == 'limelight' || Session::get('crmType') == 'limelightv2')
        {
            $postData = array();
            if(
                !empty($formPostDate['payType']) && 
                $formPostDate['payType'] == 'Crypto'
            )
            {
                $postData = array(
                    'cardType' => 'offline',
                    'customNotes'=> 'Order proceesed with MetaMask Crypto Payment App with '.$formPostDate['selectedCoin'].'  from: '.$formPostDate['fromAddress'].' to: '.$formPostDate['toAddress'].' Transaction Number: '.$formPostDate['transactionHash'],
                    'userIsAt' => Request::server()->get('HTTP_REFERER')
                );

            }


            CrmPayload::update($postData);
        }
        

    }

    public function loadMetaMaskData()
    {



        if ($this->pageType == "leadPage" && !Session::get('extensions.bypass.enable_metamask')) {  
            return; 
        }


        $campaignId = $this->getCampaignID();


        if(empty($campaignId))
        {
            return;
        }



        $campaignDetails = Campaign::find($campaignId);

        $main_price = 0.00 + $campaignDetails['shippingPrice'];

        if (!empty($campaignDetails['product_array']))
        {
            foreach ($campaignDetails['product_array'] as $childProduct)
            {
                unset($campaignDetails['product_array']);
                $main_price += $childProduct['productPrice'];
            }
        }

        $main_price = $main_price;

        
            $paymentDivHTML='';

            if ($this->metamaskConfiguration['enable_ETH']) {

                $paymentDivHTML .= '<div id="ETH" class="paymentMethods"><img src="'.Request::getOfferUrl().'/extensions/MetaMask/images/eth.png?v='.rand().'" alt="ETH_button"></div>';
            }

            if ($this->metamaskConfiguration['enable_MATIC']) {

                $paymentDivHTML .= '<div id="MATIC" class="paymentMethods"><img src="'.Request::getOfferUrl().'/extensions/MetaMask/images/matic.png?v='.rand().'" alt="MATIC_button"></div>';
            }

            if ($this->metamaskConfiguration['enable_BNB']) {

                $paymentDivHTML .= '<div id="BNB" class="paymentMethods"><img src="'.Request::getOfferUrl().'/extensions/MetaMask/images/bnb.png?v='.rand().'" alt="BNB_button"></div>';
            }

       
            echo '<script type="text/javascript"> const walletAddress = "'.$this->walletAddress.'"; const testNet = "'.$this->testNet.'"; var metaAmount =  "'.$main_price.'";; </script>

            <script type="text/javascript">
            var head = document.getElementsByTagName("HEAD")[0]; 
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = document.URL.substr(0,document.URL.lastIndexOf("/")) +"/extensions/MetaMask/css/metamask.css?v='.rand().'"; 
            
            head.appendChild(link); 

            document.getElementById("CryptoPayments").insertAdjacentHTML("afterbegin",`'.$paymentDivHTML.'`);

            </script>
            
            <script src="https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.7.1/dist/umd/index.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/@metamask/detect-provider@1.2.0/dist/detect-provider.min.js"></script>
            <script type="text/javascript" src="'.Request::getOfferUrl().'extensions/MetaMask/js/helper.js?v='.rand().'"></script>
            <script type="text/javascript" src="'.Request::getOfferUrl().'extensions/MetaMask/js/web3functions.js?v='.rand().'"></script>
            <script type="text/javascript" src="'.Request::getOfferUrl().'extensions/MetaMask/js/pageHandler.js?v='.rand().'"></script>

            
        ';

    }

    public function getCampignDetails()
    {
        $campaignDetails = array();
        $products = array();
        $dynamicCampigns = Request::query()->all();

        if (!empty($dynamicCampigns))
        {
            foreach (array_keys($dynamicCampigns) as $value)
            {
                if (preg_match("/dynamic-campaign-id-[0-9]/i", $value))
                {
                    $productQuantity = (empty($dynamicCampigns[str_replace('id', 'quantity', $value)])) ? false : $dynamicCampigns[str_replace('id', 'quantity', $value)];
                    $productPrice = (empty($dynamicCampigns[str_replace('id', 'price', $value)])) ? false : $dynamicCampigns[str_replace('id', 'price', $value)];
                    if (Session::get('steps.meta.isScrapFlow') === true)
                    {
                        $campaignId = (string) Campaign::find($dynamicCampigns[$value], true)[0]['codebaseCampaignId'];
                        $savedCampaignDetails = Config::campaigns($campaignId);
                    }
                    else
                    {
                        $savedCampaignDetails = Config::campaigns($dynamicCampigns[$value]);
                    }
                    $savedCampaignDetails['product_quantity'] = empty($productQuantity) ? $savedCampaignDetails['product_quantity'] : $productQuantity;

                    $productPrice = (empty($dynamicCampigns[str_replace('id', 'price', $value)])) ? false : $dynamicCampigns[str_replace('id', 'price', $value)];
                    $savedCampaignDetails['product_price'] = empty($productPrice) ? $savedCampaignDetails['product_price'] : $productPrice;

                    array_push($campaignDetails, $savedCampaignDetails);
                    array_push($products, $this->prepareProducts($savedCampaignDetails));
                }
            }

            if (empty($campaignDetails))
            {
                $codebaseCampigns = $this->getstepWiseCampaigns(Config::extensionsConfig('PaypalVTwo.step_campaign_map'));
                if (Session::get('steps.meta.isScrapFlow') === true)
                {
                    $codebaseCampigns[$this->currentStepId] = (string) Campaign::find($codebaseCampigns
                                    [$this->currentStepId], true)
                            ['codebaseCampaignId'];
                }
                array_push($campaignDetails, Config::campaigns($codebaseCampigns[$this->currentStepId]));
                array_push($products, $this->prepareProducts(Config::campaigns($codebaseCampigns[$this->currentStepId])));
            }
        }
        else
        {
            $codebaseCampigns = $this->getstepWiseCampaigns(Config::extensionsConfig('PaypalVTwo.step_campaign_map'));
            if (Session::get('steps.meta.isScrapFlow') === true)
            {
                $codebaseCampigns[$this->currentStepId] = (string) Campaign::find($codebaseCampigns
                                [$this->currentStepId], true)
                        ['codebaseCampaignId'];
            }
            array_push($campaignDetails, Config::campaigns($codebaseCampigns[$this->currentStepId]));
            array_push($products, $this->prepareProducts(Config::campaigns($codebaseCampigns[$this->currentStepId])));
        }

        $details = array();

        if(!empty($products))
        {
            $total = 0;
            //$products = reset($products);
            foreach ($products as $value) {
                foreach ($value as $k => $v) {
            		$total += $v['productPrice'] * $v['productQuantity'];
            	}
            }
            
            $details['amount'] = (number_format(($total + $products[0][0]['shippingPrice']) ,2));
            $details['label'] = $campaignDetails[0]['campaign_label'];
            $details['campaignId'] = $campaignDetails[0]['campaign_id'];

        }
        header('Content-Type: application/json');
        echo json_encode($details);
    }


    private function getstepWiseCampaigns($params = array())
    {
        $codebaseCampign = array();
        if (!empty($params))
        {
            foreach($params as $stepCampign){
                $codebaseCampign[$stepCampign['step_id']] = $stepCampign['campaign_id'];
            }
        }
        return $codebaseCampign;
    }

    private function prepareProducts($param)
    {
        $allProduct = $param['product_array'];
        $products = array();

        $storeProduct = json_decode($allProduct, true);
        foreach($storeProduct as $sp) {
            array_push($products, array(
                'codebaseCampaignId' => $param['id'],
                'productPrice' => !empty($param['product_price']) ? $param['product_price'] : $sp['product_price'],
                'productQuantity' => !empty($param['product_quantity']) ? $param['product_quantity'] : $sp['product_quantity'],
                'shippingPrice' => $param['shipping_price'],
                'productId' => $sp['product_id']
            ));
        }

        if($this->crm['crm_type'] == "limelightv2"){
            $products['shippingId'] = $param['shipping_id'];
            $products['enableBillingModule'] = $param['enable_billing_module'];
            $products['billingModelId'] = $param['billing_model_id'];
            $products['offerId'] = $param['offer_id'];
            $products['trialProductId'] = $param['trial_product_id'];
            $products['trialProductPrice'] = $param['trial_product_price'];
            $products['trialProductQuantity'] = $param['trial_product_quantity'];
            $products['childrenSettings'] = $param['children_settings'];
            $products['trialChildrenSettings'] = $param['trial_children_settings'];
        }
        return $products;
    } 

    
    public function getCampaignID()
    {
        $campaignId = '';
        if(!empty($this->metamaskConfiguration['metamask_campaigns']))
        {
            $campaigns      = $this->metamaskConfiguration['metamask_campaigns'];
            foreach ($campaigns as $campaign)
            {
                if($campaign['step_id'] == $this->currentStepId)
                {
                    $campaignId = $campaign['campaign_id'];
                    break;
                }
            }
        }
        return $campaignId;
    }

    public function addCustomerNotes()
    {
        
        

        if (Session::get('customer.cardType') != 'Crypto' ) {
            
            return;
        }

        $crmPayload = CrmPayload::all();

        Session::set('customer.payType' , $crmPayload['cardType']);

        $Response = CrmResponse::all();
        // echo "<pre>";
        // print_r($Response);

        if(empty($Response['success'])){

            returen;
        }

        $this->makeHttpRequest($Response);
        

    }

    public function getUrl($limelightMethod)
    {
        return trim($this->crmDetails[1]['endpoint'], '/') . $limelightMethod;
    }

    public function basicFormValidation()
    {
        // $formData   = Request::form()->all();
        $postData   = Request::query()->all();

        if (empty($postData) && empty($postData['formName'])) {
            
            return json_encode(
                                array(
                                    'sucess' => false, 'message' => 'Required data is not matched!'
                                )
                            );
        }


        if ($postData['formName'] == 'downsell') {

            parse_str($postData['formData']);
            
            if( empty($firstName) || empty($lastName) || empty($shippingAddress1) || empty($shippingCountry) || empty($shippingState) || empty($shippingCity) || empty($shippingZip) || empty($phone) || empty($email) ){

                return json_encode(
                                array(
                                    'sucess' => false, 'message' => 'Please fill all shipping details!'
                                )
                            );
            }else{

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    
                    return json_encode(
                                array(
                                    'sucess' => false, 'message' => 'Please provide a valid email!'
                                )
                            );
                }else{

                    return json_encode(
                                    array(
                                        'sucess' => true
                                    )
                                );
                }

                
            }
        }

        if ($postData['formName'] == 'checkout') {

            $prospectId = empty(Session::get('steps.1.prospectId')) ? '' : Session::get('steps.1.prospectId');
            
            if( empty($prospectId)){

                return json_encode(
                                array(
                                    'sucess' => false, 'message' => 'Prospect Id is not found!'
                                )
                            );
            }else{


                    return json_encode(
                                    array(
                                        'sucess' => true
                                    )
                                );
                

                
            }
        }

        return json_encode(
                                    array(
                                        'sucess' => true
                                    )
                                );
    }


    private function makeHttpRequest($response)
    {

        $url = $this->getUrl('/api/v1/order_update');
        $orderId = $response['orderId'];
        $fields = array('method' => 'order_update',
            'order_id' => array(

                $orderId => array(

                    "payment_received" => 1

                )

            )
        );



        $curl = curl_init();

        curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_USERPWD => $this->crmDetails[1]['username'] .':'. $this->crmDetails[1]['password'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode($fields),
        CURLOPT_HTTPHEADER => array(
        "Content-Type: application/json"
        ),
        ));


        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);

        // if ($err) {
        // echo "cURL Error #:" . $err;
        // } else {
        //     echo "<pre>";
        //     echo $response;
        // }
    }
}
