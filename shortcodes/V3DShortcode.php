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
            $config = $this->grav['config']->get('plugins.viewer3d');

            $showEdges     = $config['show_edges'] ?? false;
            $showCube      = $config['show_cube'] ?? true;
            $zoomFactor    = $config['zoom_factor'] ?? -1;
            $showCut       = $config['show_cut'] ?? false;
            $showMeasure   = $config['show_measure'] ?? false;
            $showInfopanel = $config['show_infopanel'] ?? true;
            $showDownload  = $config['show_download'] ?? true;

            if (!isset($this->modelCount)) $this->modelCount = 0;
            $modelPath = $slug.'/'.$sc->getContent();
            $out = "<div id='model".$this->modelCount."' class='online_3d_viewer' data-base='".$baseUrl."/' model='".$modelPath."' camera='-1.5,-3.0,2.0,0,0,0,0,0,1'".($showEdges ? " edge='#000000'" : "")." color='#A0B0A0'".($showCube ? " navcube='1'": "")." zoomFactor='".$zoomFactor."'>";
	    if ($showMeasure || $showDownload || $showCut)
            {
                $out .= "<div class='toolbar'><ul class='tb'>";
                if ($showDownload) $out .= "<li><a href='".$modelPath."'><img src='".$baseUrl."/export.svg' class='export'></a><span class='tt'>Download</span></li>";
                if ($showMeasure)  $out .= "<li><img src='".$baseUrl."/measure.svg' class='measure'><span class='tt'>Measure</span></li>";
                if ($showCut)      $out .= "<li><img src='".$baseUrl."/cut.svg' class='cut'><span class='tt'>Section cut</span></li>";
		$out .= "</ul></div>";
            }
            if ($showInfopanel) $out .= "<ul class='details'><li class='mmenu'></li></ul>";
            $out .= "</div>";
            $this->modelCount++;
            return $out;
        });
    }
}
