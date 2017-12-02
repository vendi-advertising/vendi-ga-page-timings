/*jslint maxparams: 4, maxdepth: 4, maxstatements: 20, maxcomplexity: 8 */
(function() {
        'use strict'; //Force strict mode

        var
            //This is the category within GA that'we writing to. All of our other
            //code expected this to be the same so probably don't change it.
            ga_category = 'TimeOnPage',

            start_time = Date.now(),

            //This is the "current" second that we're watching for
            second_to_watch_for = null,

            //This is all of the possible seconds that we're looking for.
            //Although you can change this it messes up the report so I don't
            //recommend you doing that.
            seconds = [
                        //Start at 0 seconds and run until the next timer, thus
                        //giving us 0 through 5 seconds
                        0,

                        //From here forward, this time marks the _end_ of the previous timer
                        //and the next timer starts one second more.
                        //So this is 6 through 10 seconds.
                        5,

                        //11 through 20 seconds
                        10,

                        //21 through 30 seconds
                        20,

                        //Get ?
                        30,
                        60,
                        180,
                        600,
                        1800
            ],

            //Amount of time that we've spent in a hidden window, calculated below
            hidden_time = 0,

            //This is set whenever the document is hidden so that we can remove
            //that amount of time from the master calculation.
            last_hide_time,

            //We're creating a global interval timer, this is a pointer to it so that
            //we can clear it when we're done.
            interval_pointer,

            //Whether or not the window is currently visible, set below
            is_window_visible = true,

            //This is the browser-specific property to check to see if the document is,
            //hidden, set below
            property_to_check_for_hidden,

            //This is the browser-specific event to fire for the visibility API, set below
            event_to_fire_for_visibility,

            //How often the master timer should tick. When a window isn't visible, the
            //browser will usually throttle this so it shouldn't be trusted to be accurate.
            master_timer_internal_is_ms = 250,

            runGA_Null = function()
            {
                console.warn('Google Analytics ga() function not found. Next entry has the data passed.');
                console.log(arguments);
            },

            runGA_Tag = function(info, label)
            {
                window.gtag(
                                'event',

                                //Pass the index as the action, just for sorting purposes.
                                info.index,
                                {
                                    'event_category': ga_category,
                                    'event_label': label,
                                    'non_interaction': true,
                                }
                        );
            },

            runGA_Universal = function(info, label)
            {
                var
                    func = window.ga || window.__gaTracker
                ;

                func(
                            'send',
                            'event',
                            ga_category,

                            //Pass the index as the action, just for sorting purposes.
                            info.index,
                            label,
                            {
                                'nonInteraction': 1,
                            }
                        );
            },

            /**
             * Route the event to the appropriate GA library depending on what is installed.
             */
            routeGA = function(info, immediate)
            {
                var

                    //The first pass is special. Since it doesn't have a "before" we
                    //don't increment the start. Otherwise, the "current" is actually the
                    //"end" of the previous one.
                    label_start_first_part = immediate ? info.current : ( info.current + 1 ),

                    //If we don't have an end then just append a plus sign, otherwise
                    //use a range
                    label_start = info.next ? label_start_first_part + ' - ' + info.next : label_start_first_part + '+',

                    //No matter the above, append a shared string
                    label = label_start + ' seconds',

                    //Big guy here!!!
                    //If the new 2017 gtag code is installed, used the.
                    //Otherwise, if the standard universal GA code is found, use that.
                    //Otherwise, fall back to our internal handler that does outputs to the console.
                    gaFunc = window.gtag ? runGA_Tag : ( window.ga || window.__gaTracker ) ? runGA_Universal : runGA_Null
                ;

                //Invoke the function that we determined above
                gaFunc( info, label);
            },

            handleMainTimer = function()
            {
                var
                    current_time = Date.now(),
                    diff_in_ms = ( current_time - start_time ) - hidden_time,
                    diff_in_seconds = diff_in_ms / 1000,

                    //Store this for possible use later
                    last_second_to_watch_for = second_to_watch_for,

                    //The immediate flag is used to determine the "first" ever run through
                    immediate = false
                ;

                if( ! is_window_visible )
                {
                    return;
                }

                //First time through the loop this will be empty
                if( null === second_to_watch_for )
                {
                    immediate = true;

                    //Since we're not actively looking for any specific second durations,
                    //grab the first from the array. NOTE: shift() reduces the size
                    //of the array, too!
                    second_to_watch_for = seconds.shift();
                }

                //If not enough time has elapsed, wait for the next interval
                if( diff_in_seconds < second_to_watch_for )
                {
                    return;
                }

                //We've got nothing else to monitor, bail!
                //NOTE: I think we're not getting the last item in the array
                //accounted for.
                if( 0 === seconds.length )
                {
                    clearInterval( interval_pointer );
                    return;
                }

                //Grab a new item to watch (effectively the 'next one')
                second_to_watch_for = seconds.shift();

                //This syntax is from a different version of this code but I think
                //it still makes sense so I kept it.
                routeGA(
                            {
                                current: last_second_to_watch_for,
                                next: second_to_watch_for,
                            },
                            immediate
                    );

            },

            setupMainTimer = function()
            {
                //Store the interval's pointer in a global so that we can also clear it
                interval_pointer = setInterval( handleMainTimer, master_timer_internal_is_ms );
            },

            increaseHiddenTime = function()
            {
                var
                    current_hide_time = Date.now(),
                    diff = current_hide_time - last_hide_time
                ;

                //Increase the global
                hidden_time += diff;

                console.log( 'The window was not visible for ' + diff + ' milliseconds' );
            },

            handleVisibilityChangeShared = function( is_hidden )
            {
                if( is_hidden )
                {

                    //If for some unknown reason our "hide" event is called twice
                    //in a row without a "show" event in the middle, last_hide_time
                    //might be already populated. This is probably only a problem with
                    //the legacy mode but we've kept it here anyways. Only set this
                    //variable if it hasn't been set already.
                    if( ! last_hide_time )
                    {
                        last_hide_time = Date.now();
                    }

                    //Global flag that the window is hidden
                    is_window_visible = false;
                    return;
                }

                //We're in show mode now
                is_window_visible = true;

                //Calc the amount of time that we've been hiding
                increaseHiddenTime();

                //Clear this so that we can set it anew above
                last_hide_time = null;
            },

            handleVisibilityChangeModern = function()
            {
                //We used to support legacy browsers but it just wasn't worth the pain
                handleVisibilityChangeShared( document[ property_to_check_for_hidden ] );
            },

            setupBrowserSpecificThingsHidden = function()
            {
                //Chrome 33+, Firfox 18+, IE 10+, Opera 12.10+, Safari 7+
                if( typeof document.hidden !== 'undefined' )
                {
                    property_to_check_for_hidden = 'hidden';
                    event_to_fire_for_visibility = 'visibilitychange';
                    return;
                }

                // Firefox up to v17
                if( typeof document.mozHidden !== 'undefined')
                {
                    property_to_check_for_hidden = 'mozHidden';
                    event_to_fire_for_visibility = 'mozvisibilitychange';
                    return;
                }

                // Chrome up to v32, Android up to v4.4, Blackberry up to v10
                if( typeof document.webkitHidden !== 'undefined' )
                {
                    property_to_check_for_hidden = 'webkitHidden';
                    event_to_fire_for_visibility = 'webkitvisibilitychange';
                    return;
                }
            },

            setupVisibilityChecker = function()
            {
                //Setup any browser prefixes
                setupBrowserSpecificThingsHidden();

                //Checker for modern events and a supported "hidden" property
                if (typeof document.addEventListener === 'undefined' || typeof document[ property_to_check_for_hidden ] === 'undefined' )
                {
                    console.log( 'Legacy browser detected, not performing page timings' );
                    return false;
                }

                //Bind the change event for visibility
                document.addEventListener( event_to_fire_for_visibility, handleVisibilityChangeModern, false );
                return true;
            },

            init = function()
            {
                //We only support the modern browsers for this because the legacy
                //browser have a more vague and inconsistent definition. This is
                //probably a very small population so that's OK.
                if( ! setupVisibilityChecker() )
                {
                    return;
                }

                //Bind the main timer
                setupMainTimer();
            }

        ;

        //Kick everything off
        init();
    }
    ()
);
