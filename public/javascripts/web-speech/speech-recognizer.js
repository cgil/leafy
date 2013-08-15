(function($) {
    "use strict";
    $(document).ready(function() {

        /*
         *******
         *****************
         ****************************** Helpers ********************************
         */

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


        //  Finite State Grammars
        var grammars = [{w: "TREEHOUSE", to: [
            {w: "MUSIC", to: [{w: "UP", to: [{type: "number"}]}, {w: "DOWN", to: [{type: "number"}]}]},
            {w: "LOG", to: [{w: "ADD", to: [{type: "string", length: 3, end: "STOP"}]}, {w: "DELETE", to: [{type: "string"}]}]}
        ]}];

        var curGrammars = grammars;

        /** Finds the command in a grammars array and returns the new array of grammars
         *  Traverse to next 'node', where a node is the next array of possible grammars
         *  @return next node, -1 if no more nodes, 0 if no match
         */
        var findNextNode = function(grammars, word) {
            for(var i = 0; i < grammars.length; i++) {
                var node = grammars[i];
                if(elemSet(node, "w", word)) {
                    return getNode(node);
                }
                else if(!elemSet(node, "w") || elemSet(node, "trans", true)) {  //  Transiest state
                    var type = "string";            //  Default type
                    var length = 1;                 //  Default transient state length = 1 (word)
                    var currentLength = 0;          //  Current length into transient state
                    if(elemSet(node, "type")) {     //  Get new type to search for
                        type = node["type"];
                    }
                    if(type === getType(word)) {    //  Make sure transient type is matched
                        if(elemSet(node, "end")) {  //  An end transient state word is specified
                            if(node["end"] === word) {
                                if(elemSet(node, "curLength")) {    //  Get current length if set
                                    currentLength = node["curLength"];
                                }
                                currentLength++;
                                node["curLength"] = currentLength;
                                return getNode(node);
                            }
                        }
                        if(elemSet(node, "length")) {   //  Transiest state length (iterations of successes)
                            length = node["length"];
                            if(elemSet(node, "curLength")) {    //  Get current length if set
                                currentLength = node["curLength"];
                            }
                            if(currentLength < length) {    //  Transient state continues
                                currentLength++;
                                node["curLength"] = currentLength;
                                if(currentLength === length) {
                                    return getNode(node);
                                }
                                return grammars;
                            }

                        }
                        currentLength++;
                        node["curLength"] = currentLength;
                        return getNode(node);
                    }
                    return 0; 
                }
            }
            return 0;   //  No match found
        };

        var getNode = function(node) {
            if(!elemSet(node, "to") || elemSet(node, "to", null)) { //  This is the last node
                return -1;
            }
            return node["to"];   //  Advance to next node
        };

        //  If the word is reserved or special, perform some action
        //  @return continuation statements: null- do nothing, continue loop, break from loop, etc..
        var magicCommand = function(word) {
            if(word === "TREEHOUSE") {      //  Reset
                curGrammars = grammars;
                return null;
            }
        };

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
                    words = words.split(" ");
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
                        console.dir(node);
                        if(node === 0) {       //  No matches found
                            continue;
                        }
                        else if(node === -1) { //  Finished command
                            curGrammars = grammars;
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