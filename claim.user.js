// ==UserScript==
// @name         COTG Claim Checker
// @namespace    http://tampermonkey.net/
// @version      0.56
// @description  Alliance Claim Checker for Crown of the Gods
// @author       Mohnki
// @match        https://w18.crownofthegods.com/*
// @match        https://w19.crownofthegods.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function processalliance(data) {
        var message=data.message;
        //make the message lower case for easier word identification
        message=message.toLowerCase();
        if (message.includes(greetings)) {
            //send a response in alliance chat
            cotg.chat.alliance('Hello '+data.player+'!');
        }
    }

    function unclaim(coordinates) {
        var url = "https://www.firehawk.co.za/cotg/unclaim/" + coordinates + "/"+ cotg.player.alliance() +"/" + cotg.player.name();
        var request = new XMLHttpRequest();
        var params = "action=run";
        request.open('POST', url, true);
        request.onreadystatechange = function() {
            if (request.readyState==4){
                claimed = request.responseText;
                cotg.chat.alliance(cotg.player.name() + ' Claim Removed <coords>'+coordinates+'</coords>');
                claim_write("Claim Removed: " + coordinates);
            }
        };
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        request.send(params);
        checkAllAllianceClaims();
    }

    function msToTime(duration) {

        var milliseconds = parseInt((duration%1000)/100),
            seconds = parseInt((duration/1000)%60),
            minutes = parseInt((duration/(1000*60))%60),
            hours = parseInt((duration/(1000*60*60))%24);

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    }

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                break;
            }
        }
    }

    function claim_write(text) {
        var outtext='<h3 style="color: black; text-align:center">'+text+"</h3>";
        $("#claimed_result").html(outtext);
    }

    function listAllCities(citylist) {
        console.clear();
        console.log(citylist);
        if ($("#MYpopupbox").length == 0){
            createmypopup();
        }
        if ($("#MYpopupbox").css('display') == 'none'){
            $("#MYpopupbox").show();
        }

        var alliance_claims = "<table class='sortable' style=\"text-align:center; vertical-align: top\"><tr><td style=\"text-align:center; vertical-align: top\" colspan=\"3\"><h3 style=\"color: black; text-align:center\">Alliance Claims</h3></td></tr>";
        var player_claims = "<table class='sortable' style=\"text-align:center; vertical-align: top\"><tr><td style=\"text-align:center; vertical-align: top\" colspan=\"2\"><h3 style=\"color: black; text-align:center\">Your Claims</h3></td></tr>";

        for (var x in citylist) {
            alliance_claims+='<tr><td style="text-align:center; vertical-align: top" ><coords><span class="coordblink shcitt">'+citylist[x].xpos+':'+citylist[x].ypos+'<span><coords></td><td style="width: 60%"> ['+citylist[x]['alliance']+'] </td><td>'+citylist[x]['player']+'</td></tr>';
            if(citylist[x]['player'] === cotg.player.name()){
                player_claims+='<tr><td style="text-align:center; vertical-align: top" ><coords><span class="coordblink shcitt" >'+citylist[x].xpos+':'+citylist[x].ypos+'<span><coords></td></tr>';
            }
        }

        alliance_claims += "</table>";
        player_claims += "</table>";

        var outtext="<table style=\"align-content:center; vertical-align: top\">"+
            "<tr><td style=\"align-content:center; vertical-align: top; width: 70%\">"+alliance_claims+"</td><td style=\"align-content:center; vertical-align: top\">"+player_claims+"</td></tr>"+
            "</table>";

        $("#MyDevOutput").html(outtext);
    }

    var div = document.getElementById('emptyspotAction');
    var addcheckbutton = "<button class='regButton greenbuttonGo greenb' id='Check'>Check Claim</button>";
    var addclaimbutton = "<button class='regButton greenbuttonGo greenb' id='Claim'>Claim</button>";
    var addunclaimbutton = "<button class='regButton greenbuttonGo greenb' id='Unclaim'>Remove Claim</button>";
    //var addclaimresult = "<div style='overflow-y: auto;overflow-x: hidden;height: 85%;' id='claimed_result'></div>";
    var addclaimresult = "<div id='claimed_result'></div>";
    //div.innerHTML += addcheckbutton;
    //div.innerHTML += addclaimbutton;
    //div.innerHTML += addunclaimbutton;
    //div.innerHTML += addclaimresult;
    var refreshAllbtn = '<div id="RefreshAll" class="regButton greenbuttonGo greenb"><center><span id="irtmsp">Refresh</span></center></div>';

    var popupbox="<div id='MYpopupbox' style='right: 50px; display: none;' class='popUpBox ui-resizable ui-draggable'>"+
        '<div class="ppbwinbgr">'+
        '<div class="ppbwintop"></div>'+
        '<div class="ppbwincent"></div>'+
        '<div class="ppbwinbott"></div>'+
        '</div>'+
        '<div class="ppbwincontent" style="justify-content: center">'+
        "<div class='popUpBar'>"+
        "<span class='ppspan'>Alliance Claim Script</span>"+
        "<button id='MYpopupboxX' onclick=\"$('#MYpopupbox').hide('slow');\" class='xbutton greenb'>"+
        "<div id='xbuttondiv'><div><div id='centxbuttondiv'></div></div></div></button>"+
        "</div>"+
        addclaimresult+
        addcheckbutton+
        addclaimbutton+
        addunclaimbutton+
        refreshAllbtn+
        '<div id="MyDevOutput" style="padding: 5%;overflow-y: scroll; max-height:60%; height:60%; max-width:85%; !important;">'+
        "</div>"+
        "</div></div>";

    var addbutton='<button id="Checkall" class="tabButton" style="width: 130px;"><span id="irtmsp">Claims</span></button>';
    $("body").append(popupbox);
    $("#tpdcontent").append(addbutton);

    document.getElementById('createCityGo').style.display = 'none';

    document.getElementById('Unclaim').style.display = 'none';
    document.getElementById('Claim').style.display = 'none';
    document.getElementById('Check').style.display = 'block';

    $("#createCityGo").insertAfter("#Unclaim");

    var is_claimed = "";
    var claimed = "";

    $('#Checkall').click(function() {
        checkAllAllianceClaims();
    });
    $('#RefreshAll').click(function() {
        checkAllAllianceClaims();
    });

    function checkAllAllianceClaims() {
        var url = "https://www.firehawk.co.za/cotg/list/" + cotg.player.alliance();
        var request = new XMLHttpRequest();
        var params = "action=run";
        request.open('POST', url, true);
        request.onreadystatechange = function() {
            if (request.readyState==4){
                is_claimed = request.responseText;
            }
        };
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        request.send(params);
        sleep(1000);
        request.onreadystatechange = function() {
            if (request.readyState==4){
                is_claimed = JSON.parse(request.response);
                listAllCities(is_claimed);
            }
        };
    }

    $('#Check').click(function() {
        var coordinates = document.getElementById('emptyspotcoord').innerHTML;
        var url = "https://www.firehawk.co.za/cotg/claim_check/" + coordinates + "/" + cotg.player.alliance();
        var request = new XMLHttpRequest();
        var params = "action=run";
        request.open('POST', url, true);
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        request.send(params);
        request.onreadystatechange = function() {
            if (request.readyState==4){
                is_claimed = request.responseText;
                if (is_claimed !== "False") {
                    if (is_claimed.includes(cotg.player.name())) {
                        claim_write('The claim belongs to you');
                        document.getElementById('createCityGo').style.display = 'block';
                        document.getElementById('Claim').style.display = 'none';
                        document.getElementById('Unclaim').style.display = 'block';
                        document.getElementById('Check').style.display = 'none';
                    } else {
                        claim_write(is_claimed);
                        document.getElementById('createCityGo').style.display = 'none';
                        document.getElementById('Claim').style.display = 'none';
                        document.getElementById('Unclaim').style.display = 'none';
                        document.getElementById('Check').style.display = 'block';
                    }
                }
                if (is_claimed === "False") {
                    claim_write("Spot unclaimed");
                    document.getElementById('createCityGo').style.display = 'block';
                    document.getElementById('Claim').style.display = 'block';
                    document.getElementById('Check').style.display = 'none';
                    document.getElementById('Unclaim').style.display = 'none';
                }
            }
        };
    });

    $('#Claim').click(function() {
        var coordinates = document.getElementById('emptyspotcoord').innerHTML;
        var url = "https://www.firehawk.co.za/cotg/claim/" + coordinates + "/"+ cotg.player.alliance() +"/" + cotg.player.name();
        var request = new XMLHttpRequest();
        var params = "action=run";
        request.open('POST', url, true);
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        request.send(params);
        request.onreadystatechange = function() {
            if (request.readyState==4){
                claimed = request.responseText;
                cotg.chat.alliance(cotg.player.name()+' Claimed <coords>'+coordinates+'</coords>');
                claim_write("Claimed: " + coordinates);
            }
        };
    });

    $('#Unclaim').click(function() {
        var coordinates = document.getElementById('emptyspotcoord').innerHTML;
        unclaim(coordinates);
    });

    $('#emptyspotcoord').bind("DOMSubtreeModified",function(){
        document.getElementById('createCityGo').style.display = 'none';
        document.getElementById('Claim').style.display = 'none';
        document.getElementById('Unclaim').style.display = 'none';
        document.getElementById('Check').style.display = 'block';
        claim_write("");
    });

    if ( document.getElementById("Sum").classList.contains('greenb') ){
        document.getElementById("Sum").classList.toggle('greenb');
    }

})();
