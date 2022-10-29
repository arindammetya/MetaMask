"use strict";
var metaQueryParam;
var metaQueryParameters;
var metaCampaignId;
var serialize = function(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
};
var getMetaDynamicCampaign = function() {
    var campaignsAll = {};
    var campaignPattern = /^campaigns\[[0-9]\]\[id]/i;
    var qtyPattern = /^campaigns\[[0-9]\]\[quantity]/i;
    var price = /^campaigns\[[0-9]\]\[price]/i;
    var inputsAll = document.getElementsByTagName('input');
    if (inputsAll.length > 0) {
        var i = 1;
        for (var j = 0; j < inputsAll.length; j++) {
            var snglInput = inputsAll[j];
            var nameAttr = snglInput.getAttribute('name');
            if (campaignPattern.test(nameAttr)) {
                if (!snglInput.hasAttribute('disabled')) {
                    campaignsAll['dynamic-campaign-id-' + i] = snglInput.value;
                    var quantityName = nameAttr.replace('id', 'quantity');
                    var quantityPrice = nameAttr.replace('id', 'price');
                    if (typeof document.getElementsByName(quantityName)[0] !== "undefined" && document.getElementsByName(quantityName)[0] !== null) {
                        campaignsAll['dynamic-campaign-quantity-' + i] = document.getElementsByName(quantityName)[0].value;
                        document.getElementsByName(quantityName)[0].setAttribute('onchange', "getMetaDynamicCampaign()");
                    } else {
                        campaignsAll['dynamic-campaign-quantity-' + i] = 0;
                    }
                    
                    if (typeof document.getElementsByName(quantityPrice)[0] !== "undefined" && document.getElementsByName(quantityPrice)[0] !== null) {
                        campaignsAll['dynamic-campaign-price-' + i] = document.getElementsByName(quantityPrice)[0].value;
                        document.getElementsByName(quantityPrice)[0].setAttribute('onchange', "getMetaDynamicCampaign()");
                    }
                    i += 1;
                }
                snglInput.setAttribute('onchange', "getMetaDynamicCampaign()");
            }
        }
        metaQueryParam = serialize(campaignsAll);
        metaQueryParameters = (typeof metaQueryParam !== "undefined" && metaQueryParam !== null) ? metaQueryParam : "";
        // metaQueryParameters = parseQueryString(metaQueryParameters);
        getCampaignDetail(metaQueryParameters);
        // Meta Payment Update

    }
};

function parseQueryString(qs) {
    const items = qs.split('&');
    return items.reduce((data, item) => {
        const [key, value] = item.split('=');
        if (data[key] !== undefined) {
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]]
            }
            data[key].push(value)
        } else {
            data[key] = value
        }
        return data
    }, {})
}

function getCampaignDetail(campaigns){

    $.ajax({
              url: app_config.offer_path + AJAX_PATH + 'extensions/metamask/get-campaign-details'+(campaigns ? '?'+campaigns : ''),
              headers: {
                    'Content-Type': 'application/json'
                },
              data: {
                    campaigns: campaigns
              },
              success: function(data) {
                console.log(data);
                  updateCart(data);
          }
     });
}

function updateCart(data){
    // paymentRequest.update({
    //   total: {
    //       amount : parseInt((data.amount).toFixed(0)),
    //       label : data.label
    //   }
    // });
    metaAmount = parseFloat(data.amount).toFixed(2);
    metaCampaignId = data.campaignId;
    
}


//our handler

function prepareDataAndSubmitForOfllineOrderWithCryptoPayment(transactionReport , selectedCoin){

    
    
    var postData = {
        
        cardType:'Crypto',
        paymentMethodName: 'Crypto',
        payType: 'Crypto',
        transactionHash: transactionReport.transactionHash,
        fromAddress: transactionReport.from,
        toAddress: transactionReport.to,
        transactionReport: transactionReport,
        selectedCoin: selectedCoin
    };
    // if(prospectId)
    // {
    //     postData['prospectId'] = prospectId;
    // }
    var formArr = ['checkout_form', 'is-upsell', 'downsell_form1'];
    
    var formselector = document.forms[0];
    if(document.forms && document.forms.length > 1 && (formArr.indexOf(document.forms[1].name) != -1))
    {
      formselector = document.forms[1];
    }
    var action = 'checkout';
    if(formselector.name.indexOf('downsell') > -1)
    {
        action = 'downsell';
    }
    if(formselector.name.indexOf('upsell') > -1)
    {
        action = 'upsell';
    }
  
    $('#loading-indicator').show();
    
    $.ajax({
          url: app_config.offer_path + AJAX_PATH + action,
          type: 'POST',
          data: $(formselector).serialize() + '&' + $.param(postData),
          success: function(data) {
              $('#loading-indicator').hide();
              console.log(data);
              if(data.success)
              {
                  window.location.href = data.redirect;
              }
              else{
                  var errorMsg = [];
                  if(data.errors)
                  {
                      errorMsg = data.errors;
                  }
                  else{
                      errorMsg = ['Order has been declined.']
                  }
                  cb.errorHandler(errorMsg);
              }
          },
          error: function(error) {
              console.log(error);
              $('#loading-indicator').hide();
          }
     });
}

