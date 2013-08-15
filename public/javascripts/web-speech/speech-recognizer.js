(function($) {
    "use strict";
    $(document).ready(function() {

        var recognition = null;
        try {
            recognition = new webkitSpeechRecognition();
        } catch(e) {
            recognition = Object;
        }
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.requiredConfidence = 0.8;
                    console.dir(recognition);

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
            var pos = textArea.getCursorPosition() - interimResult.length;
            textArea.val(textArea.val().replace(interimResult, ''));
            interimResult = '';
            textArea.setCursorPosition(pos);
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    insertAtCaret(textAreaID, event.results[i][0].transcript);
                } 
                else {
                    insertAtCaret(textAreaID, event.results[i][0].transcript + '\u200B');
                    interimResult += event.results[i][0].transcript + '\u200B';
                }
            }
        };

        recognition.onend = function() {
            $('.speech-content-mic').removeClass('speech-mic-works').addClass('speech-mic');
        };
    });
})(window.jQuery);