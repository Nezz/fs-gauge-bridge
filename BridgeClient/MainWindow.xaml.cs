using System;
using System.Windows;
using System.Windows.Interop;

namespace BridgeClient
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

			this.Loaded += MainWindow_Loaded;
        }

		private void MainWindow_Loaded(object sender, RoutedEventArgs e)
		{
            // Create an event handle for the WPF window to listen for SimConnect events
            var handle = new WindowInteropHelper(sender as Window).Handle; // Get handle of main WPF Window
            var handleSource = HwndSource.FromHwnd(handle); // Get source of handle in order to add event handlers to it
            handleSource.AddHook(WndProc);
            SimConnectViewModel.WindowHandle = handle;
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            SimConnectViewModel.Instance?.SimConnect?.HandleSimConnectEvents(msg, ref handled);
            return IntPtr.Zero;
        }
    }
}
