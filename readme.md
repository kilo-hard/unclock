# Un-Clock

[Un-Clock](https://kilo-hard.github.io/unclock/) is a fork of Geoff's [Sun Clock](https://github.com/virtualgeoff/sunclock) that is headed loosely in a direction inspired by the clock item from Minecraft. 

This web app works by downloading a small JS simulation of the solar system, which then calculates locally, on your device, the sunrise, sunset, golden hour, twilight times, as well as moon phase and position, for the location you supply. The location data is not sent over the network.

If the Minecraft reference is unfamiliar to you, the basic idea is that instead of a stationary face with an hour hand sweeping around it, dark and light halves of a disc are rotated into view behind a window to mimic the sky's rotation of day and night. by default, I kept a minute indicator that goes around the outside of the dial/window, somewhat like on a conventional analog clock. 

You can [see Un-Clock in action at https://kilo-hard.github.io/unclock/](https://kilo-hard.github.io/unclock/)

and Sun Clock, which is also a cool project, at [sunclock.net](https://sunclock.net/)

### Extras

Here's an [animation of Un-Clock at over 1000x natural speed](https://kilo-hard.github.io/unclock/animation.html) for demonstration and UI experimentation purposes, which might be helpfull if you're still having trouble telling what you're looking at. You may find the animation is also just fun to stare at and space out :)

As an aid for observing the dawn/dusk process, [this page](https://kilo-hard.github.io/unclock/degtool.html) uses the same underlying methods to generate a table of times when the sun is at each whole degree of angle with respect to the horizon plane, from 10 degrees below to 30 degrees above.


### License

Un-Clock is released under the [MIT License](LICENSE.txt).

You are free to use, modify, and distribute this project, including in proprietary
software, provided you include the copyright notice and license text when distributing
code derived from this project.


### Additional credits

Sun Clock, and therefore Un-Clock, includes the following open-source libraries:

- [SunCalc](https://github.com/mourner/suncalc) by Vladimir Agafonkin — BSD 2-Clause ([license](libs/suncalc/LICENSE))
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) by Don Cross — MIT ([license](libs/astronomy/LICENSE.txt))
