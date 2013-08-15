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
        var grammars = [{w: "LEAFY", to: [
            {w: "MUSIC", to: [{w: "UP", to: [{trans: true, type: "number"}]}, {w: "DOWN"}]},
            {w: "LOG", to: [{w: "ADD"}, {w: "DELETE"}]}
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
                    if(!elemSet(node, "to") || elemSet(node, "to", null)) { //  This is the last node
                        return -1;
                    }
                    return node["to"];   //  Advance to next node
                }
                else if(!elemSet(node, "w") || elemSet(node, "trans", true)) {  //  Transiest state
                    var type = "string";            //  Default type
                    if(elemSet(node, "type")) {     //  Get new type to search for
                        type = node["type"];
                    }
                    if(type === getType(word)) {    //  Make sure transient type is matched
                        if(!elemSet(node, "to") || elemSet(node, "to", null)) { //  This is the last node
                            return -1;
                        }
                        return node["to"];   //  Advance to next node
                    }
                    return 0; 
                }
            }
            return 0;   //  No match found
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
                var word = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    insertAtCaret(textAreaID, word);
                    node = findNextNode(curGrammars, word);
                    if(node === 0) {       //  No matches
                        continue;
                    }
                    else if(node === -1) { //  Finished command
                        curGrammars = grammars;
                    }
                    else {                  //  Found the next node
                        curGrammars = node;
                    }
                } 
                else {
                    insertAtCaret(textAreaID, word + '\u200B');
                    interimResult += word + '\u200B';
                }
            }
        };

        recognition.onend = function() {
            $('.speech-content-mic').removeClass('speech-mic-works').addClass('speech-mic');
        };
    });
})(window.jQuery);