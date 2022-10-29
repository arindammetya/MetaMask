<?php

/**
 * Author: Arindam Metya
 * This a configuration file. With out this your app will not work
 */

return array(
    'hooks'    => array(
        array(
            'event'    => 'beforeBodyTagClose',
            'callback' => "Extension\MetaMask\MetaMask@loadMetaMaskData",
            'priority' => 100,
        ),
        array(
            'event'    => 'afterCrmPayloadReady',
            'callback' => "Extension\MetaMask\MetaMask@updateMethod",
            'priority' => 100,
        ),
        array(
            'event'    => 'afterAnyCrmRequest',
            'callback' => "Extension\MetaMask\MetaMask@addCustomerNotes",
            'priority' => 100,
        )
    ),
    'routes'   => array(

        array(
            'slug'     => 'get-campaign-details',
            'callback' => "Extension\\MetaMask\\MetaMask@getCampignDetails"
        ),
       array(
            'slug'     => 'basic-form-validation',
            'callback' => "Extension\\MetaMask\\MetaMask@basicFormValidation"
        ),
    ),
    'custom_html' => array(
        'template_js' => 'js/metamask.js',
        'enable' => true,
        'template_name' => 'html/metamask.html'
    ),
    'settings' => array(
        array(
            'label' => 'Production Tokenized Key',
            'key'   => 'live_tokenized_key',
            'type'  => 'string',
            'value' => '',
            'optional' => false,
            'hint'  => '',
        )
        
    ),
    
);
