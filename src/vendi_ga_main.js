import * as visibility_checker from 'visibility_checker';

class vendi_ga_main
{
    constructor()
    {
        this.visibility_checker = new visibility_checker( () => { this.handleVisibilityChangeModern } );

        if( ! this.visibility_checker.setupVisibilityChecker() )
        {
            console.log( 'Legacy browser detected, not performing page timings' );
            return;
        }
    }

    handleVisibilityChangeModern()
    {
        console.log('here');
    }
}
