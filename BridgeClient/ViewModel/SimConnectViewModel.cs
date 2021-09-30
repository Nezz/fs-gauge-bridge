using BridgeClient.DataModel;
using FlightStreamDeck.Core;
using FlightStreamDeck.Logics;
using FlightStreamDeck.SimConnectFSX;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace BridgeClient
{
    class SimConnectViewModel : BaseViewModel
    {
        public static SimConnectViewModel Instance;
        public static IntPtr WindowHandle;

        public bool IsConnected => this.SimConnect.Connected;

        public FpsCounter BridgeCounter { get; }
		public Dictionary<(TOGGLE_VALUE variable, string unit), double> Status { get; private set; }

        public SimConnectFlightConnector SimConnect { get; }


        public SimConnectViewModel()
        {
            Instance = this;
            BridgeCounter = new FpsCounter();

            this.SimConnect = new SimConnectFlightConnector(new TraceLogger<SimConnectFlightConnector>());
            this.SimConnect.Closed += (sender, e) => this.InitializeSimConnect();

            this.InitializeSimConnect();
        }


        private async void InitializeSimConnect()
        {
            while (true)
            {
                if (WindowHandle == IntPtr.Zero)
                {
                    await Task.Delay(1000);
                    continue;
				}

                try
                {
                    this.SimConnect.Initialize(WindowHandle);

                    this.SimConnect.GenericValuesUpdated += OnSimConnect_GenericValuesUpdated;

                    this.SimConnect.RegisterSimValues(
                        (TOGGLE_VALUE.TRANSPONDER_CODE__1, null),
                        (TOGGLE_VALUE.TRANSPONDER_CODE__2, null),
                        (TOGGLE_VALUE.TRANSPONDER_STATE__1, null),
                        (TOGGLE_VALUE.COM_ACTIVE_FREQUENCY__1, null),
                        (TOGGLE_VALUE.COM_ACTIVE_FREQUENCY__2, null),
                        (TOGGLE_VALUE.COM_STANDBY_FREQUENCY__1, null),
                        (TOGGLE_VALUE.COM_STANDBY_FREQUENCY__2, null),
                        (TOGGLE_VALUE.COM_TRANSMIT__1, null),
                        (TOGGLE_VALUE.COM_TRANSMIT__2, null),
                        (TOGGLE_VALUE.COM_RECEIVE__1, null),
                        (TOGGLE_VALUE.COM_RECEIVE__2, null),
                        (TOGGLE_VALUE.COM_SPACING_MODE__1, null),
                        (TOGGLE_VALUE.COM_SPACING_MODE__2, null),
                        (TOGGLE_VALUE.NAV_ACTIVE_FREQUENCY__1, null),
                        (TOGGLE_VALUE.NAV_ACTIVE_FREQUENCY__2, null),
                        (TOGGLE_VALUE.NAV_STANDBY_FREQUENCY__1, null),
                        (TOGGLE_VALUE.NAV_STANDBY_FREQUENCY__2, null),
                        //(TOGGLE_VALUE.NAV_IDENT__1, null),
                        //(TOGGLE_VALUE.NAV_IDENT__2, null),
                        (TOGGLE_VALUE.ADF_ACTIVE_FREQUENCY__1, null),
                        (TOGGLE_VALUE.ADF_ACTIVE_FREQUENCY__2, null),
                        (TOGGLE_VALUE.GPS_DRIVES_NAV1, null),
                        (TOGGLE_VALUE.AUTOPILOT_NAV_SELECTED, null),
                        (TOGGLE_VALUE.PLANE_LATITUDE, null),
                        (TOGGLE_VALUE.PLANE_LONGITUDE, null),
                        (TOGGLE_VALUE.NUMBER_OF_ENGINES, null),
                        (TOGGLE_VALUE.ENGINE_TYPE__1, null),
                        (TOGGLE_VALUE.ENGINE_TYPE__2, null),
                        (TOGGLE_VALUE.SIM_ON_GROUND, null));

                    break;
                }
                catch (COMException)
                {
                    Trace.WriteLine("Failed to connect to Flight Simulator");
                    await Task.Delay(5000);
                }
            }
        }

        private void OnSimConnect_GenericValuesUpdated(object sender, ToggleValueUpdatedEventArgs args)
        {
            this.Status = args.GenericValueStatus;

            SimpleHTTPServer.TakeOperation(this.Status
                .Select(kvp => new WSValue
                {
                    name = kvp.Key.variable.ToString().Replace("__", ":").Replace("_", " "),
                    unit = kvp.Key.unit,
                    value = kvp.Value,
                })
                .ToArray());

            BridgeCounter.GotFrame();
        }

        public void SendEvent(WSValue ev)
		{
            if (!ev.name.StartsWith("K:"))
			{
                Trace.WriteLine($"Unsupported event type {ev.name}");
                return;
			}

            if (!Enum.TryParse<TOGGLE_EVENT>(ev.name.Substring(2), out var toggleEvent))
			{
                Trace.WriteLine($"Unsupported event {ev.name}");
                return;
            }

            this.SimConnect.RegisterToggleEvent(toggleEvent);
            this.SimConnect.Trigger(toggleEvent, Convert.ToUInt32(ev.value));
        }
    }
}
