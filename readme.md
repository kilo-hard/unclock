# Un-Clock

Un-Clock is a fork of Geoff's [Sun Clock](https://github.com/virtualgeoff/sunclock) that is headed loosly in a direction inspired by the clock item from MineCraft. 

This web app works by downloading a small JS simulation of the solar system, which then calculates locally, on your device, the sunrise, sunset, golden hour, twilight times, as well as moon phase and position*, for the location you supply. The location data is not sent over the network.

I'm still getting started, and think I've mostly got it functioning again after breaking everything, but there could be division zero.

*Known issue: some of the moon position logic in my fork is broken currently, and if the provided longitude and time zone diverge significantly, the angle of the "moon hand" on the face will be wildly wrong.

You can see Un-Clock in action here: [https://kilo-hard.github.io/unclock/](https://kilo-hard.github.io/unclock/)

and Sun Clock, which is also a cool project, at [sunclock.net](https://sunclock.net/)

### License

Un-Clock is released under the [MIT License](LICENSE.txt).

You are free to use, modify, and distribute this project, including in proprietary
software, provided you include the copyright notice and license text when distributing
code derived from this project.

### Additional credits

Sun Clock, and therefore Un-Clock, includes the following open-source libraries:

- [SunCalc](https://github.com/mourner/suncalc) by Vladimir Agafonkin — BSD 2-Clause ([license](libs/suncalc/LICENSE))
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) by Don Cross — MIT ([license](libs/astronomy/LICENSE.txt))
