using BridgeClient.DataModel;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace BridgeClient.ViewModel
{
    class TextWithValue : BaseViewModel
    {
        public string Name { get => Get<string>(); set => Set(value); }
        public string Value { get => Get<string>(); set => Set(value); }
        public bool IsOK { get => Get<bool>(); set => Set(value); }

        public TextWithValue() => IsOK = true;
    }

    class GaugeInfo : BaseViewModel
    {
        public string Name { get => Get<string>(); set => Set(value); }
        public int Index { get => Get<int>(); set => Set(value); }
        public ICommand Command { get; set; }
        
        public GaugeInfo(string url)
        {
            Name = Path.GetFileName(url);
            Command = new RelayCommand(() =>
            {
                ((App)App.Current).Navigate(Index);
            });
        }
    }

    class MainWindowViewModel : BaseViewModel
    {
        private VFS vfs;

        public SimConnectViewModel SimConnect { get => Get<SimConnectViewModel>(); set => Set(value); }
        public ObservableCollection<GaugeInfo> Gauges { get => Get<ObservableCollection<GaugeInfo>>(); set => Set(value); }
        public string PanelText { get => Get<string>(); set => Set(value); }
        public List<TextWithValue> Data { get; }
        public string Title => "FS Gauge Bridge";
        public ICommand OpenLog { get; }
        public ICommand OpenVars { get; }

        public MainWindowViewModel(ICommand log, ICommand openVars, VFS vfs, SimConnectViewModel simConnect)
        {
            OpenLog = log;
            OpenVars = openVars;
            PanelText = "Panel.cfg not loaded yet";

            this.vfs = vfs;
            this.SimConnect = simConnect;

            var isSimConnected = new TextWithValue { Name = "SimConnect" };
            var simBridgeOps = new TextWithValue { Name = "Bridge ops/sec" };
            var acTitle = new TextWithValue { Name = "Aircraft Title" };

            Data = new List<TextWithValue> {
                isSimConnected,
                acTitle,
                 simBridgeOps ,
            };


            var t = new DispatcherTimer();
            t.Interval = TimeSpan.FromSeconds(0.2);
            t.Tick += (_, __) =>
            {
              //  SimConnect.ReadCounter.CalculateFps();

                isSimConnected.Value = SimConnect.IsConnected ? "Connected" : "Connecting...";
                isSimConnected.IsOK = SimConnect.IsConnected;

                simBridgeOps.Value = Math.Round(SimConnect.BridgeCounter.Fps).ToString();
                simBridgeOps.IsOK = !SimConnect.IsConnected || SimConnect.BridgeCounter.Fps > 1;
            };
            t.Start();

            acTitle.Value = "Longitude";

            Gauges = new ObservableCollection<GaugeInfo>(LoadGauges());
        }

        private List<GaugeInfo> LoadGauges()
        {
            var gauges = this.vfs.LoadPanel();

            var gauges2 = gauges.Select(g => new GaugeInfo(g.htmlgauge00.path)).ToList();
            for(var i = 0; i < gauges2.Count; i++)
            {
                gauges2[i].Index = i;
            }
            return gauges2;
        }
    }
}
