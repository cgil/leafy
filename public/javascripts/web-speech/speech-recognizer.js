(function($) {
    "use strict";
    $(document).ready(function() {

        /*******************************GLOBALS**********************************/
        var SERVER_URL = "http://54.221.205.192";
        var APPS_URL = SERVER_URL + "/apps";

        /**********************************************************************/

        /*
         *******
         *****************
         ****************************** Helpers ********************************
         */

        var commandNodes = [];

        //  Check if an element exists in an object
        var elemSet = function(obj, prop, val) {
            if(obj.hasOwnProperty(prop)) {
                if(typeof(val) === 'undefined') {
                    return true;
                }
                else {
                    if(obj[prop] === val) {
                        return true;
                    }
                    return false;
                }      
            }
            return false;
        };

        //  Check a variable or array is set
        var isset = function (check) {
            var test = (typeof check !== 'undefined' && check !== null && check !== "");
            if (check instanceof Array) {
                test = test && (check.length > 0);
            }
            return test;
        };

        //  Type checking: string, number
        //  More in the future
        var getType = function(input) {
            if(!isNaN(input)) {
                return "number";
            }
            else {
                return "string";
            }
        };

        /***********************************************************************
         *****************
         *******
         */

        var resetGrammars = function() {
            var grammarsCopy = $.extend(true, [], grammars);
            return grammarsCopy;
        };



         /****************** GRAMMARS AND NODE TRAVERSAL *********************/

        /*  Finite State Grammars
         *  This is used to specify commands and the formats the commands take.
         *  For example: 
         *  [{w: "TREEHOUSE", to: [
         *   {w: "LOG", duty: "command", hook: "log", to: [{w: "ADD", to: [{type: "string", length: 3, end: "STOP"}]}, {w: "DELETE", to: [{type: "string"}]}]}
         *  ]}];
         *  Forms the commands:
         *      TREEHOUSE -> LOG -> ADD -> stringx3
         *      TREEHOUSE -> LOG -> DELETE -> stringx1
         *
         *  A node = [{ w: word, to: [next nodes], options: options]
         *  Each node is an array which has options for the current node which can include:
         *  w: word to match against (if no word specified we assume its a transient state)
         *  to: an array for the next node (if no to property is specified OR to === null, we assume it's the end of the command)
         *  trans: if true, we are in a transient state where we listen for any input
         *  type: for type checking (*, string, int, percent, ect..), can narrow down transient state input, defaults to string
         *  length: length of transient state (i.e length = 3 means we're in the transient state for 3 successful word captures), defaults to 1
         *  curLength: current length of transient state (current number of succesful word captures), defaults to 0
         *  data: an array to store captured words while in a transient state
         *  hook: a name given to the node that can be used as an identfier later
         *  duty: the special purpose that the state provides- such as containing the app name to be used:
         *      implemented-
         *          command, if command is specified the hook must also be specified and must be the name
         *                  if the app to be called. {duty: "command", hook: "log"} calls the log.js app.
         */
        var grammars = [{w: "TREEHOUSE", to: [
            {w: "MUSIC", duty: "command", hook: "music", to: [{w: "UP", to: [{type: "number"}]}, {w: "DOWN", to: [{type: "number"}]}]},
            {w: "LOG", duty: "command", hook: "log", to: [{w: "ADD", to: [{type: "*", length: 3, end: "STOP"}]}, {w: "DELETE", to: [{type: "string"}]}]},
            {w: "GIVE", to: [{type: "string", hook: "name", to: [{type: "number", hook: "amount", to: [{w: "POINTS", duty: "command", hook: "points"}]}]}]}
        ]}];

        var curGrammars = resetGrammars(); //  Current grammars node

        /** Finds the command in a grammars array and returns the new array of grammars
         *  Traverse to next 'node', where a node is the next array of possible grammars
         *  @return next node, -1 if no more nodes, 0 if no match
         */
        var findNextNode = function(grammars, word) {
            for(var i = 0; i < grammars.length; i++) {
                var node = grammars[i];
                if(elemSet(node, "w", word)) {
                    return getNextNode(node);
                }
                else if(!elemSet(node, "w") || elemSet(node, "trans", true)) {  //  Transient state
                    node["trans"] = true;
                    var type = "string";            //  Default type
                    var length = 1;                 //  Default transient state length = 1 (word)
                    var currentLength = 0;          //  Current length into transient state
                    if(elemSet(node, "type")) {     //  Get new type to search for
                        type = node["type"];
                    }
                    if(type === "*" || type === getType(word)) {    //  Make sure transient type is matched
                        if(elemSet(node, "end")) {  //  An end transient state word is specified
                            if(node["end"] === word) {
                                if(elemSet(node, "curLength")) {    //  Get current length if set
                                    currentLength = node["curLength"];
                                }
                                currentLength++;
                                node["curLength"] = currentLength;
                                return getNextNode(node);
                            }
                        }
                        if(elemSet(node, "length")) {   //  Transiest state length (iterations of successes)
                            length = node["length"];
                        }
                        if(elemSet(node, "curLength")) {    //  Get current length if set
                            currentLength = node["curLength"];
                        }

                        if(currentLength < length) {    //  Transient state continues
                            currentLength++;
                            node["curLength"] = currentLength;

                            var data = [];                 //  Data contains a list of words added while in the transient state
                            if(elemSet(node, "data")) {    //  Get current data array if set
                                data = node["data"];
                            }
                            data.push(word);
                            node['data'] = data;

                            if(currentLength === length) {  //  Length met, finished transient state
                                return getNextNode(node);
                            }
                            return getNextNode(grammars, false);
                        }
                        currentLength++;
                        node["curLength"] = currentLength;
                        return getNextNode(node);
                    }
                    return 0; 
                }
            }
            return 0;   //  No match found
        };

        // Returns the next node or current node if next is set to false
        var getNextNode = function(node, next) {
            if(typeof next !== 'undefined' && next === false) {
                return node;
            }
            commandNodes.push(node);    //  Store the current node into list of command nodes

            if(!elemSet(node, "to") || elemSet(node, "to", null)) { //  This is the last node
                return -1;
            }
            return node["to"];   //  Advance to next node
        };

        //  If the word is reserved or special, perform some action
        //  @return continuation statements: null- do nothing, continue loop, break from loop, etc..
        var magicCommand = function(word) {
            if(word === "TREEHOUSE") {      //  Reset
                curGrammars = resetGrammars();
                return null;
            }
        };

        var sendCommad = function() {
            var args = [];
            var command = null;
            for (var i = 0; i < commandNodes.length; i++) {
                var node = commandNodes[i];
                if(elemSet(node, "duty")) {     //  Special duty node, collect information for request
                    if(node["duty"] === "command" && elemSet(node, "hook") && isset(node["hook"])) {
                        command = node["hook"];
                    }
                }
                if(elemSet(node, "trans")) {    //  Transient state collect the args stored
                    var arg = {};
                    if(elemSet(node, "hook")) {
                        arg.hook = node["hook"];
                    }
                    arg.data = node["data"];
                    arg.length = node["data"].length;
                    args.push(arg);
                }   
            }
            
            if(isset(command)) {
                var url = APPS_URL + "/" + command;
                url += "?callback=?";
                var data = "args="+JSON.stringify(args);

                $.ajax({
                    dataType: 'jsonp',
                    data: data,                      
                    jsonp: 'callback',
                    url: url,                       
                    success: function(data) {
                        window.console.log(data);
                    }
                });
            }
        };


        /****************** SPEECH RECOGNITION *********************/

        var recognition = null;
        try {
            recognition = new webkitSpeechRecognition();
        } catch(e) {
            recognition = Object;
        }
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.requiredConfidence = 0.8;

        var interimResult = '';
        var textArea = $('#speech-page-content');
        var textAreaID = 'speech-page-content';

        $(document).on('click', '.speech-mic', function(){
            startRecognition();
        });

        $(document).on('click', '.speech-mic-works', function(){
            recognition.stop();
        });

        var startRecognition = function() {
            $('.speech-content-mic').removeClass('speech-mic').addClass('speech-mic-works');
            textArea.focus();
            recognition.start();
        };

        recognition.onresult = function (event) {
            var node = null;
            var pos = textArea.getCursorPosition() - interimResult.length;
            textArea.val(textArea.val().replace(interimResult, ''));
            interimResult = '';
            textArea.setCursorPosition(pos);
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                var words = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    insertAtCaret(textAreaID, words);
                    words = words.trim().split(" ");    //  Transcript can come in as phrases, need to split it
                    for (var j = 0; j < words.length; j++) {
                        var word = words[j];   

                        word = word.toUpperCase().trim();
                        var magicOption = magicCommand(word);   //  If the word is special or reserved, do the special things
                        if(magicOption === "continue") {
                            continue;
                        }
                        else if(magicOption === "break") {
                            break;
                        }

                        node = findNextNode(curGrammars, word); //  Find the next node
                        if(node === 0) {       //  No matches found
                            continue;
                        }
                        else if(node === -1) { //  Finished command
                            sendCommad();   //  Transmit the finished command
                            commandNodes = [];          //  Reset the command nodes
                            curGrammars = resetGrammars();
                        }
                        else {                  //  Found the next node
                            curGrammars = node;
                        } 
                    }
                }
                else {
                    insertAtCaret(textAreaID, words + '\u200B');
                    interimResult += words + '\u200B';
                }
            }
        };

        recognition.onend = function() {
            $('.speech-content-mic').removeClass('speech-mic-works').addClass('speech-mic');
        };
    });
})(window.jQuery);

