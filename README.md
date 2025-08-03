# PO parser

This project aim to parse PO translation files and compile it to type definitions to serve as a base to a [unplugin](https://unplugin.unjs.io/) plugin (to be able to use it with Vite and maybe something else down the road).

I want to use PO editing tools like [weblate](https://weblate.org/pt-br/), [POedit](https://poedit.net/) and others. Since PO files are really popular they are an "OK" way of doing i18n.

But I want it to behave like (paraglide JS)[https://inlang.com/m/gerre34r/library-inlang-paraglideJs]... but much more "simpler" since I don't have enough time to make something so nice.

Other motivation for me to develop something like that is just to learn more about gettext and parsers!


> [!WARNING]
> This is not ready for any use! 

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

[The files that are being used to test the parser](https://gitlab.com/news-flash/news_flash_gtk/-/blob/master/po) are from a [Gnome Circle](https://circle.gnome.org/) application called [Newsflash](https://apps.gnome.org/en/NewsFlash/). 

I never used PO files before, this is my first contact and I know that building a parser for something you do not understand is not a brilliant idea, but I want to try it anyways

[This is the content I am using to base myself on RN](http://pology.nedohodnik.net/doc/user/en_US/ch-poformat.html)