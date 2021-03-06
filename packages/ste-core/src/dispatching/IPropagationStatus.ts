/**
 * Indicates the object support a propagation status.
 * 
 * @export
 * @interface IPropagationStatus
 */
export interface IPropagationStatus
{
    /**
     * Indicates if the propagation was stopped.
     * 
     * @type {boolean}
     * @memberOf IPropagationStatus
     */
    readonly propagationStopped: boolean
}