/* eslint-disable */
// @ts-nocheck
import * as log from 'loglevel';
import CanvasWrapper from './canvas_wrapper';
import DomainController from './domain_controller';
import Util from '../util';
import FieldIntegrator from '../impl/integrator';
import {StreamlineParams} from '../impl/streamlines';
import StreamlineGenerator from '../impl/streamlines';
import Vector from '../vector';

/**
 * Handles creation of roads
 */
export default class RoadGUI {
    protected streamlines: StreamlineGenerator;
    private existingStreamlines: RoadGUI[] = [];
    protected domainController = DomainController.getInstance();
    protected preGenerateCallback: () => any = () => {};
    protected postGenerateCallback: () => any = () => {};

    private streamlinesInProgress: boolean = false;

    constructor(protected params: StreamlineParams,
                protected integrator: FieldIntegrator,
                protected redraw: () => void,
                protected _animate=false) {
        this.streamlines = new StreamlineGenerator(
            this.integrator, this.domainController.origin,
            this.domainController.worldDimensions, this.params);

        // Update path iterations based on window size
        this.setPathIterations();
        window.addEventListener('resize', (): void => this.setPathIterations());
    }

    set animate(b: boolean) {
        this._animate = b;
    }

    get allStreamlines(): Vector[][] {
        return this.streamlines.allStreamlinesSimple;
    }

    get roads(): Vector[][] {
        // For drawing not generation, probably fine to leave map
        return this.streamlines.allStreamlinesSimple.map(s =>
            s.map(v => this.domainController.worldToScreen(v.clone()))
        );
    }

    roadsEmpty(): boolean {
        return this.streamlines.allStreamlinesSimple.length === 0;
    }

    setExistingStreamlines(existingStreamlines: RoadGUI[]): void {
        this.existingStreamlines = existingStreamlines;
    }

    setPreGenerateCallback(callback: () => any) {
        this.preGenerateCallback = callback;
    }

    setPostGenerateCallback(callback: () => any) {
        this.postGenerateCallback = callback;
    }

    clearStreamlines(): void {
        this.streamlines.clearStreamlines();
    }

    async generateRoads(animate=false): Promise<unknown> {
        this.preGenerateCallback();

        this.domainController.zoom = this.domainController.zoom / Util.DRAW_INFLATE_AMOUNT;
        this.streamlines = new StreamlineGenerator(
            this.integrator, this.domainController.origin,
            this.domainController.worldDimensions, Object.assign({},this.params));
        this.domainController.zoom = this.domainController.zoom * Util.DRAW_INFLATE_AMOUNT;

        for (const s of this.existingStreamlines) {
            this.streamlines.addExistingStreamlines(s.streamlines)   
        }

        this.redraw();
        
        return this.streamlines.createAllStreamlines(animate).then(() => this.postGenerateCallback());
    }

    /**
     * Returns true if streamlines changes
     */
    update(): boolean {
        return this.streamlines.update();
    }

    /**
     * Sets path iterations so that a road can cover the screen
     */
    private setPathIterations(): void {
        const max = 1.5 * Math.max(window.innerWidth, window.innerHeight);
        this.params.pathIterations = max/this.params.dstep;
        this.redraw()
    }
}
