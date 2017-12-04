export class visibility_checker
{
    constructor( func )
    {
        this.property_to_check_for_hidden = null;
        this.event_to_fire_for_visibility = null;
        this.visibility_change_callback = func;
    }

    _setupBrowserSpecificThingsHidden()
    {
        //Chrome 33+, Firfox 18+, IE 10+, Opera 12.10+, Safari 7+
        if( typeof document.hidden !== 'undefined' )
        {
            this.property_to_check_for_hidden = 'hidden';
            this.event_to_fire_for_visibility = 'visibilitychange';
            return;
        }

        // Firefox up to v17
        if( typeof document.mozHidden !== 'undefined')
        {
            this.property_to_check_for_hidden = 'mozHidden';
            this.event_to_fire_for_visibility = 'mozvisibilitychange';
            return;
        }

        // Chrome up to v32, Android up to v4.4, Blackberry up to v10
        if( typeof document.webkitHidden !== 'undefined' )
        {
            this.property_to_check_for_hidden = 'webkitHidden';
            this.event_to_fire_for_visibility = 'webkitvisibilitychange';
            return;
        }
    }

    setupVisibilityChecker()
    {
        //Setup any browser prefixes
        this._setupBrowserSpecificThingsHidden();

        //Checker for modern events and a supported "hidden" property
        if (typeof document.addEventListener === 'undefined' || typeof document[ this.property_to_check_for_hidden ] === 'undefined' )
        {
            return false;
        }

        //Bind the change event for visibility
        document.addEventListener( this.event_to_fire_for_visibility, this.visibility_change_callback, false );
        return true;
    }
}
