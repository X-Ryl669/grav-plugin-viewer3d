<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;
use Grav\Common\Utils as Utils;

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
            $baseUrl = Utils::url('plugin://viewer3d/assets/img');
            $showEdges = $this->grav['config']->get('plugins.viewer3d')['show_edges'];
            $showCube = $this->grav['config']->get('plugins.viewer3d')['show_cube'];
            $showCut = $this->grav['config']->get('plugins.viewer3d')['show_cut'];
            $showMeasure = $this->grav['config']->get('plugins.viewer3d')['show_measure'];
            $showInfopanel = $this->grav['config']->get('plugins.viewer3d')['show_infopanel'];
            $showDownload = $this->grav['config']->get('plugins.viewer3d')['show_download'];

            $modelPath = $slug.'/'.$sc->getContent();
            $out = "<div class='online_3d_viewer' data-base='".$baseUrl."/' model='".$modelPath."' camera='-1.5,-3.0,2.0,0,0,0,0,0,1'".($showEdges ? " edge='#000000'" : "")." color='#A0B0A0'".($showCube ? " navcube='1'": "").">";
	    if ($showMeasure || $showDownload || $showCut)
            {
                $out .= "<div class='toolbar'><ul id='tb'>";
                if ($showDownload) $out .= "<li><a href='".$modelPath."'><img src='".$baseUrl."/export.svg' id='export'></a><span class='tt'>Download</span></li>";
                if ($showMeasure)  $out .= "<li><img src='".$baseUrl."/measure.svg' id='measure'><span class='tt'>Measure</span></li>";
                if ($showCut)      $out .= "<li><img src='".$baseUrl."/cut.svg' id='cut'><span class='tt'>Section cut</span></li>";
		$out .= "</ul></div>";
            }
            if ($showInfopanel) $out .= "<ul id='details'><li class='mmenu'></li></ul>";
            $out .= "</div>";
            return $out;
        });
    }
}
