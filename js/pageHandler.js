//Page Laevel Code
//Arindam Metya
//This Js is responsible for user interaction on page lavel
document.querySelectorAll(".paymentMethods").forEach(el=>{

    el.addEventListener('click',function (e) {

            let id = this.getAttribute('id');

            selectedCoin = id;

            if (testNet) {

              requiredChainId = chainDetails[id].testNet;

            }else{

              requiredChainId = chainDetails[id].net;

            }

                //parent Div
                var divElement = document.createElement("Div");
                divElement.id = "paymentModel";
                divElement.className = "modalCustom";

                    //modal Box
                    var modalBox = document.createElement("Div");
                    modalBox.id = "paymentModelBox";
                    modalBox.className = "modalBox";

                        //Modal Content WC button
                        var modelContent1 = document.createElement("div");
                        modelContent1.id = "wcButton";
                        modelContent1.className = "modal-content";
                        modelContent1.setAttribute("onclick" , "connectWC()");
                            var img = document.createElement("img");
                            img.src = "extensions/MetaMask/images/wc.png";

                        modelContent1.appendChild(img);

                        //MetaMask button
                        var modelContent2 = document.createElement("div");
                        modelContent2.id = "metamaskButton";
                        modelContent2.className = "modal-content";
                        modelContent2.setAttribute("onclick" , "connectMetamask()");
                        modelContent2.style.display = "none";
                            var image = document.createElement("img");
                            image.src = "extensions/MetaMask/images/metamask.png";

                        modelContent2.appendChild(image);

                        //close button

                        var close = document.createElement("div");
                        close.id = "closeButton";
                        close.className = "closeButton";
                        close.setAttribute("onclick" , "closeModal()");
                            var cImage = document.createElement("img");
                            cImage.src = "extensions/MetaMask/images/close.png";
                        close.appendChild(cImage);

               
                    modalBox.appendChild(modelContent1);
                    modalBox.appendChild(modelContent2);
                    modalBox.appendChild(close);


                divElement.appendChild(modalBox);

            

            //Basic form validation before showing the payment modal


            basicFormValidation(divElement);
            
    })
});


function closeModal() {

  document.getElementById("paymentModel").style.display = "none";
  document.getElementById("paymentModel").remove();
}


function basicFormValidation(divElement){


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

    console.log(action);

    $.ajax({
              url: app_config.offer_path + AJAX_PATH + 'extensions/metamask/basic-form-validation',
              headers: {
                    'Content-Type': 'application/json'
                },
              data: {
                    formName: action,
                    formData: $(formselector).serialize()
              },
              success: function(data) {
                //console.log(data);
                if(data.sucess){


                    // Appending the div element to body
                    document.getElementsByTagName("body")[0].appendChild(divElement);
                    document.getElementById("paymentModel").style.display = "block";
                    detectMetamask();

                }else{
                    
                    let errors = [] ;
                
                    errors.push(data.message);
                    cb.errorHandler(errors);
                    return false;
                }
                
                  
          }
     });
}

