# Crafty JS
A JavaScript game **framework* and not engine. Uses jQuery like syntax for code organisation and conforming to
the Entity-Component-System paradigm. [Read this article for more information](http://cowboyprogramming.com/2007/01/05/evolve-your-heirachy/).

***

##Using Crafty
Game objects are divided into *Entities* and *Component*. Rather than the typical hierarchy, objects are composed of
functional components that augment the capabilities (sort of like adding classes to DOM elements).

<code>
    var player = Crafty.e();
	Crafty(player).addComponent("2D, gravity");
</code>

The above code will create a new entity then add two components labelled `2D` and `gravity`. These components
will give the entity attributes and functions to extend its functionality. For example after adding the components
to the `player` entity, we can use a function provided by the `2D` component.

<code>
    Crafty(player).attr({w: 50, h: 150}).area(); //will return 7500
</code>

In the code example we are setting the `width` and `height` properties inherited from the `2D` component. We can
then call the `area` method also inherited from the `2D` component.