﻿using System;
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

        public string panel_path { get; set; }
        public string panel_name { get; set; }
        public HtmlGauge htmlgauge00 { get; set; } = new HtmlGauge();

    }

    class CfgManager
    {
        public static Dictionary<string, string> titleToAircraftDirectoryName = new Dictionary<string, string>();
        public static Dictionary<string, List<VCockpitConfigEntry>> aircraftDirectoryNameToGaugeList = new Dictionary<string, List<VCockpitConfigEntry>>();
        public static Dictionary<string, CfgFile> aircraftDirectoryNameToCockpitCfg = new Dictionary<string, CfgFile>();

        public static void PrintReport()
        {
            foreach (var title in titleToAircraftDirectoryName.Keys)
            {
                var directoryName = titleToAircraftDirectoryName[title];
                if (aircraftDirectoryNameToGaugeList.ContainsKey(directoryName))
                {
                    var gauges = aircraftDirectoryNameToGaugeList[directoryName];
                    Trace.WriteLine($"CFG: Ready to fly: {title} with {gauges.Count} vcockpit entries.");
                }
                else
                {
                    Trace.WriteLine($"CFG: WARNING: Not ready: {title}");
                }
            }
        }

        public static void Initialize(VFS vfs)
        {
            var aircraftDirectoryNames = vfs.FindFiles((f) => f.StartsWith(@"simobjects\airplane") && f.EndsWith("aircraft.cfg")).
                Select(x => Path.GetFileName(Path.GetDirectoryName(x))).ToList();

            foreach (var airplaneDirectoryName in aircraftDirectoryNames)
            {
                Trace.WriteLine("CFG: ------------------------------");
                Trace.WriteLine($"CFG: Discovered cfg: {airplaneDirectoryName}");
                try
                {
                    // Load aircraft.cfg
                    var relativeAircraftcfg = Path.Combine(@"simobjects\airplanes", airplaneDirectoryName, @"aircraft.cfg");

                    var resolvedCfgPath = vfs.Resolve(relativeAircraftcfg);
                    Trace.WriteLine($"CFG: Loading from {relativeAircraftcfg} ({resolvedCfgPath})");

                    var aircraftCfg = new CfgFile(resolvedCfgPath);
                    aircraftCfg.ReadMultipleSections("FLTSIM.", (section, sectionTitle) =>
                    {
                        if (section.ContainsKey("title"))
                            Trace.WriteLine($"CFG: Aircraft.cfg: Title: {section["title"]}");
                        titleToAircraftDirectoryName[section["title"].Replace("\"", "")] = airplaneDirectoryName;
                    });
                }
                catch (Exception ex)
                {
                    Trace.WriteLine("CFG: Failed to load aircraft.cfg " + ex);
                }
                try
                {
                    // Load panel.cfg
                    var relativePanelCfg = Path.Combine(@"simobjects\airplanes", airplaneDirectoryName, @"panel\panel.cfg");
                    var relativePanelXml = Path.Combine(@"simobjects\airplanes", airplaneDirectoryName, @"panel\panel.xml");
                    var resolvedPanelCfg = vfs.Resolve(relativePanelCfg);
                    if (resolvedPanelCfg != null)
                    {
                        aircraftDirectoryNameToGaugeList[airplaneDirectoryName] = LoadPanelCfg(resolvedPanelCfg, relativePanelXml);
                    }
                    else
                    {
                        Trace.WriteLine("CFG: No panel.cfg found");
                    }
                }
                catch (Exception ex)
                {
                    Trace.WriteLine("CFG: Failed to load panel.cfg " + ex);
                }
                try
                {
                    // Load cockpit.cfg
                    var relativeCockpitCfg = Path.Combine(@"simobjects\airplanes", airplaneDirectoryName, @"cockpit.cfg");
                    var resolvedCockpitCfg = vfs.Resolve(relativeCockpitCfg);
                    if (resolvedCockpitCfg != null)
                    {
                        var cockpitCfg = new CfgFile(resolvedCockpitCfg, true);

                        aircraftDirectoryNameToCockpitCfg[airplaneDirectoryName] = cockpitCfg;
                    }
                    else
                    {
                        Trace.WriteLine("CFG: No cockpit.cfg found");
                    }
                }
                catch (Exception ex)
                {
                    Trace.WriteLine("CFG: Failed to load cockpit.cfg " + ex);
                }
            }
        }

        private static List<VCockpitConfigEntry> LoadPanelCfg(string fullPath, string relativePanelXml = null)
        {
            var panelCfg = new CfgFile(fullPath);
            var gauges = new List<VCockpitConfigEntry>();
            Action<Dictionary<string, string>, string> callback = (section, sectionTitle) =>
              {
                  var cfgEntry = new VCockpitConfigEntry();
                  var gaugeKey = section.Keys.FirstOrDefault(j => j.StartsWith("htmlgauge"));
                  if (string.IsNullOrWhiteSpace(gaugeKey))
                  {
                      Trace.WriteLine("CFG: Panel.cfg: Gauge key not found!");
                  }
                  else
                  {
                      var key = section[gaugeKey].Split(',').Select(x => x.Trim()).ToArray();

                      cfgEntry.htmlgauge00.path = key[0];
                      cfgEntry.htmlgauge00.x = int.Parse(key[1]);
                      cfgEntry.htmlgauge00.y = int.Parse(key[2]);
                      cfgEntry.htmlgauge00.width = int.Parse(key[3]);
                      cfgEntry.htmlgauge00.height = int.Parse(key[4]);
                      cfgEntry.panel_path = relativePanelXml;
                      cfgEntry.panel_name = sectionTitle;

                      var size = section["size_mm"];
                      cfgEntry.size_mm_w = int.Parse(size.Split(',')[0]);
                      cfgEntry.size_mm_h = int.Parse(size.Split(',')[1]);

                      if (!section.TryGetValue("pixel_size", out var pixelSize))
					  {
                          pixelSize = size;
					  }

                      cfgEntry.pixel_size_w = int.Parse(pixelSize.Split(',')[0]);
                      cfgEntry.pixel_size_h = int.Parse(pixelSize.Split(',')[1]);

                      gauges.Add(cfgEntry);
                      Trace.WriteLine($"CFG: Panel.cfg: htmlgauge: {cfgEntry.htmlgauge00.path}");
                  }
              };
            panelCfg.ReadMultipleSections("VCOCKPIT0", callback, 1, 9);
            panelCfg.ReadMultipleSections("VCOCKPIT1", callback, 0, 9);
            return gauges;
        }

        internal static void SetPanelForTitle(string fileName, string title)
        {
            if (!titleToAircraftDirectoryName.ContainsKey(title))
            {
                // If we had no aircraft.cfg.
                titleToAircraftDirectoryName[title] = Guid.NewGuid().ToString();
            }

            aircraftDirectoryNameToGaugeList[titleToAircraftDirectoryName[title]] = LoadPanelCfg(fileName);

            var aircraftDir = Directory.GetParent(Directory.GetParent(fileName).FullName).FullName;
            var cockpitCfgPath = Path.Combine(aircraftDir, "cockpit.cfg");

            var cockpitCfg = new CfgFile(cockpitCfgPath, true);

            aircraftDirectoryNameToCockpitCfg[titleToAircraftDirectoryName[title]] = cockpitCfg;
        }
    }
}
