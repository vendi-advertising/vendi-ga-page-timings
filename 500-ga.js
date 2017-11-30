/*jslint maxparams: 4, maxdepth: 4, maxstatements: 20, maxcomplexity: 8 */
(function() {
        'use strict'; //Force strict mode

        var

            ga_category = 'TimeOnPage',

            runGA_Null = function()
            {
                console.warn('Google Analytics ga() function not found. Next entry has the data passed.');
                console.log(arguments);
            },

            runGA_Tag = function(timer, index, label)
            {
                window.gtag(
                                'event',

                                //Pass the index as the action, just for sorting purposes.
                                index,
                                {
                                    'event_category': ga_category,
                                    'event_label': label,
                                    'non_interaction': true,
                                }
                        );
            },

            runGA_Universal = function(timer, index, label)
            {
                var
                    func = window.ga || window.__gaTracker
                ;
                func(
                            'send',
                            'event',
                            ga_category,

                            //Pass the index as the action, just for sorting purposes.
                            index,
                            label,
                            {
                                'nonInteraction': 1,
                            }
                        );
            },

            /**
             * Route the event to the appropriate GA library depending on what is installed.
             */
            routeGA = function(timer, index)
            {
                var
                    //Grab various properties
                    dur_start = timer.hasOwnProperty('dur_start') ? timer.dur_start : 0,
                    dur_end   = timer.hasOwnProperty('dur_end')   ? timer.dur_end   : null,

                    //If we don't have an end then just append a plus sign, otherwise
                    //use a range
                    label_start = dur_end ? dur_start + ' - ' + dur_end : dur_start + '+',

                    //No matter the above, append a shared string
                    label = label_start + ' seconds',

                    //Big guy here!!!
                    //If the new 2017 gtag code is installed, used the.
                    //Otherwise, if the standard universal GA code is found, use that.
                    //Otherwise, fall back to our internal handler that does outputs to the console.
                    gaFunc = window.gtag ? runGA_Tag : ( window.ga || window.__gaTracker ) ? runGA_Universal : runGA_Null
                ;

                //Invoke the function that we determined above
                gaFunc( timer, index, label);
            },

            /**
             * Either invoke GA or set a timer to invoke GA later.
             */
            maybeStartTimer = function(timer, index)
            {
                var
                    //Get our start time or 0 for immediate
                    dur_start = timer.hasOwnProperty('dur_start') ? timer.dur_start : 0,

                    //Just a constant
                    ms = 1000,

                    //How many milliseconds for the timeout
                    dur_in_ms = dur_start * ms
                ;

                //If we have a zero start then just run the GA code and exit
                if(0 === dur_start)
                {
                    routeGA(timer, index);
                    return;
                }

                //This is ugly, can't wait for ES6 arrow functions.
                //Anyway, to get access to timer and index we need to close
                //over them. If that doesn't make sense, probably don't touch
                //this bit.
                setTimeout(
                            (
                                function(timer, index)
                                {
                                    return  function()
                                            {
                                                routeGA(timer, index);
                                            };
                                }
                            )(timer, index),
                            dur_in_ms
                        );

            },

            init = function()
            {
                var
                    //Timers that we're interested in.
                    //Don't set a dur_start to start immediately.
                    //dur_end is really only used for a label (see above)
                    timers = [
                                {                 dur_end: 5   },
                                {dur_start: 6,    dur_end: 10  },
                                {dur_start: 11,   dur_end: 20  },
                                {dur_start: 21,   dur_end: 30  },
                                {dur_start: 31,   dur_end: 60  },
                                {dur_start: 61,   dur_end: 180 },
                                {dur_start: 181,  dur_end: 600 },
                                {dur_start: 601,  dur_end: 1800},
                                {dur_start: 1801               },
                            ],
                    i
                ;

                for(i = 0; i < timers.length; i++)
                {
                    maybeStartTimer(timers[i], i);
                }

            }

        ;

        //Kick everything off
        init();
    }
    ()
);
