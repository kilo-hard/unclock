# Un-Clock

[Un-Clock](https://kilo-hard.github.io/unclock/) is a fork of Geoff's [Sun Clock](https://github.com/virtualgeoff/sunclock) that is headed loosly in a direction inspired by the clock item from MineCraft. 

This web app works by downloading a small JS simulation of the solar system, which then calculates locally, on your device, the sunrise, sunset, golden hour, twilight times, as well as moon phase and position, for the location you supply. The location data is not sent over the network.

If the minecraft reference is unfamiliar to you, the basic idea is that instead of a stationary face with an hour hand sweeping around it, dark and light halves of a disc are rotated into veiw behind a window to mimic the sky's rotatation of day and night. by default, I kept a minute indicator that goes around the outside of the dial/window, somewhat like on a conventional analog clock. 

You can [see Un-Clock in action at https://kilo-hard.github.io/unclock/](https://kilo-hard.github.io/unclock/)

and Sun Clock, which is also a cool project, at [sunclock.net](https://sunclock.net/)

I also made an [animation of Un-Clock at over 1000x natural speed](https://kilo-hard.github.io/unclock/animation.html) for demonstration purposes, which might be helpfull if you're still having trouble telling what you're looking at. You may find the animation is also just fun to stare at and space out :)


### License

Un-Clock is released under the [MIT License](LICENSE.txt).

You are free to use, modify, and distribute this project, including in proprietary
software, provided you include the copyright notice and license text when distributing
code derived from this project.


### Additional credits

Sun Clock, and therefore Un-Clock, includes the following open-source libraries:

- [SunCalc](https://github.com/mourner/suncalc) by Vladimir Agafonkin — BSD 2-Clause ([license](libs/suncalc/LICENSE))
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) by Don Cross — MIT ([license](libs/astronomy/LICENSE.txt))
