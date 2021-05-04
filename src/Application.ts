// 回调函数类型别名
// 回调函数需要第三方实现和设置，所有导出该回调函数
export type TimerCallback = ( id: number, data: any ) => void;

// 纯数据类
// 我们不需要导出Timer类，因为只是作为内部类使用
class Timer
{
    public id: number = -1; // 计时器的id号 

    // 标记当前计时器是否有效，很重要的一个变量，具体看后续代码
    public enabled: boolean = false;

    public callback: TimerCallback;  // 回调函数，到时间会自动调用
    public callbackData: any = undefined; // 用作回调函数的参数

    public countdown: number = 0; // 倒计时器，每次update时会倒计时
    public timeout: number = 0;  // 
    public onlyOnce: boolean = false;

    constructor ( callback: TimerCallback )
    {
        this.callback = callback;
    }
}

export class Application {
    public timers: Timer[] = []

    private _timerId: number = -1

    private _fps: number = 0

    protected _start: boolean = false

    protected _requestId: number = -1

    protected _lastTime !: number 

    protected _startTime !: number

    public canvas: HTMLCanvasElement

    // 声明每帧回调函数
    public frameCallback: ( ( app: Application ) => void ) | null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        this.frameCallback = null;
    }

    public isRunning(): boolean {
        return this._start
    }

    public get fps() {
        return this._fps
    }

    public start() {
        if (this._start === false) {
            this._start = true

            this._lastTime = -1
            this._startTime = -1

            this._requestId = requestAnimationFrame((mesc: number): void => {
                this.step(mesc)
            })
        }
    }

    protected step(timeStamp: number): void {
        //第一次调用本函数时，设置start和lastTime为timestamp
        if ( this._startTime === -1 ) this._startTime = timeStamp;
        if ( this._lastTime === -1 ) this._lastTime = timeStamp;

        //计算当前时间点与第一次调用step时间点的差
        let elapsedMsec = timeStamp - this._startTime;

        //计算当前时间点与上一次调用step时间点的差(可以理解为两帧之间的时间差)
        // 此时intervalSec实际是毫秒表示
        let intervalSec = ( timeStamp - this._lastTime );

        // 第一帧的时候,intervalSec为0,防止0作分母
        if ( intervalSec !== 0 )
        {
            // 计算fps
            this._fps = 1000.0 / intervalSec;
        }

        // 我们update使用的是秒为单位，因此转换为秒表示
        intervalSec /= 1000.0;

        //记录上一次的时间戳
        this._lastTime = timeStamp;

        // console.log (" elapsedTime = " + elapsedMsec + " diffTime = " + intervalSec);
        // 先更新
        this.update( elapsedMsec, intervalSec );
        // 后渲染
        this.render();

        if ( this.frameCallback !== null )
        {
            this.frameCallback( this );
        }
        // 递归调用，形成周而复始的前进
        requestAnimationFrame( ( elapsedMsec: number ): void =>
        {
            this.step( elapsedMsec );
        } );
    }

    //虚方法，子类能覆写（override），用于更新
    //注意: 第二个参数是秒为单位，第一参数是毫秒为单位
    public update ( elapsedMsec: number, intervalSec: number ): void { }

    //虚方法，子类能覆写（override），用于渲染
    public render (): void { }

    // 虚函数，子类覆写（overide），用于同步各种资源后启动Application
    public async run (): Promise<void>
    {
        // 调用start方法，该方法会启动requestAnimationFrame
        // 然后不停的进行回调
        this.start();
    }
}