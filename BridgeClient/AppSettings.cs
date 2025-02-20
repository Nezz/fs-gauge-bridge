﻿namespace BridgeClient
{
    class VFSSettings
    {
        public class VFSSourceTemplate
        {
            public string[] WindowsStore { get; set; }
            public string[] Steam { get; set; }
        }

        public VFSSourceTemplate Templates { get; set; } = new VFSSourceTemplate();

        public string[] Source { get; set; }
        public string Airplane { get; set; }
    }

    class WebserverSettings
    {
        public int? Port { get; set; }
    }

    class AppSettings
    {
        public VFSSettings VFS { get; set; } = new VFSSettings();
        public WebserverSettings Webserver { get; set; } = new WebserverSettings();
    }
}
