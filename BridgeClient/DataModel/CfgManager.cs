using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace BridgeClient.DataModel
{
    class HtmlGauge
    {
        public string path { get; set; }
        public double x { get; set; }
        public double y { get; set; }
        public double width { get; set; }
        public double height { get; set; }
    }

    class VCockpitConfigEntry
    {
        public double size_mm_w { get; set; }
        public double size_mm_h { get; set; }
        public double pixel_size_w { get; set; }
        public double pixel_size_h { get; set; }

        public string panel_name { get; set; }
        public HtmlGauge htmlgauge00 { get; set; } = new HtmlGauge();
    }
}
