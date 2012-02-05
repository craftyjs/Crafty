# Crafty JS
A JavaScript game engine. Uses jQuery like syntax for code organisation and conforming to
the Entity-Component-System paradigm. [Read this article for more information](http://cowboyprogramming.com/2007/01/05/evolve-your-heirachy/).

***

##Using Crafty
Game objects are divided into *Entities* and *Component*. Rather than the typical hierarchy, objects are composed of
functional components that augment the capabilities (sort of like adding classes to DOM elements).
<code>
    var player = Crafty.e();
	player.addComponent("2D, Gravity");
</code>

The above code will create a new entity then add two components labelled `2D` and `Gravity`. These components
will give the entity attributes and functions to extend its functionality. For example after adding the components
to the `player` entity, we can use a function provided by the `2D` component.
<code>
    player.attr({w: 50, h: 150}).area(); //will return 7500
</code>

In the code example we are setting the `width` and `height` properties inherited from the `2D` component. We can
then call the `area` method also inherited from the `2D` component.

##Developing

This is the workflow for committing to Crafty when you are working on more than one features. Replace _pengyu_ by your own github user name.

Following [Fork A Repo](http://help.github.com/fork-a-repo/), fork louisstow/Crafty to get pengyu/Crafty.

    # Obviously not necessarily if you have already cloned it.
    1. git clone git@github.com:pengyu/Crafty.git
    # Give the name 'upstream' to the central repository
    2. git remote add upstream https://github.com/louisstow/Crafty.git
    3. git checkout develop
    # Work on a different branch
    4. git checkout -b <some_arbitary_name>
    # Make all the changes and commits until the new feature is stable.
    # Give a better branch name to describe the changes you have made.
    5. git branch -m <descriptive_name> 
    # Pushes the new branch to your own github fork
    6. git push origin <descriptive_name>

Following [Send pull requests](http://help.github.com/send-pull-requests/), make a pull request from pengyu/Crafty:\<descriptive\_name\> to louisstow/Crafty:\<descriptive\_name\>

If you want to start working on another feature while waiting for the new branch to be merged, follow these steps:

    git checkout develop
    git fetch upstream
    git merge upstream/develop
    #Then follow the above steps 4-6.

You may need to wait for some time before your pull requests are processed. In order to use all your newly developed features that are not pulled yet, you can create your local develop repository then merge the new features into it.

    git checkout develop
    git fetch upstream
    git merge upstream/develop
    git checkout -b pengyu_develop
    git merge <descriptive_name_1>
    git merge <descriptive_name_2>
    ...
    git merge <descriptive_name_n>


Once your pull request is completed, delete the feature branch:

    #Delete the local branch
    git branch -d <descriptive_name>
    #Delete the branch from your GitHub repository at pengyu/Crafty:<descriptive_name>
    git push origin :<descriptive_name>

If you have done everything correctly above, then you can stop here.

Sometimes you may mess up the above process, then the following git commands may be useful to you.

Check all branches. Copy a remote branch to local.

    git branch -a
    git checkout -b develop upstream/develop

Check difference between local and remote branch.

    git diff master bar/master

Set git status check repository to origin/develop.

    git branch --set-upstream develop origin/develop

Rename a branch.

    git branch -m old_branch new_branch

If this is causing you trouble, ask in the forums!

