<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;

class V3DShortcode extends Shortcode
{
    public function init()
    {
        $this->shortcode->getHandlers()->add('3dv', function(ShortcodeInterface $sc) {
            $this->shortcode->addAssets('css', 'plugin://viewer3d/assets/css/3dviewer.css');
            $this->shortcode->addAssets('js', 'plugin://viewer3d/assets/js/three.min.js');
            $this->shortcode->addAssets('js', 'plugin://viewer3d/assets/js/o3dv.min.js');
            $this->shortcode->addAssets('js', 'plugin://viewer3d/assets/js/3dviewer.js');
            $slug = $this->grav['page']->slug();
            $showEdges = $this->grav['config']->get('plugins.viewer3d')['show_edges'];
            return "<div class='online_3d_viewer' model='".$slug.'/'.$sc->getContent()."' camera='-1.5,-3.0,2.0,0,0,0,0,0,1'".($showEdges ? " edge='#000000'" : "")." color='#A0B0A0'><div class='toolbar'></div><div class='details'></div></div>";
        });
    }
}