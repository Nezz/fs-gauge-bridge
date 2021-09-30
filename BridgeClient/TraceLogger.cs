using System;
using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace BridgeClient
{
	public class TraceLogger<T> : ILogger<T>
	{
		public LogLevel LogLevel { get; set; }

		public TraceLogger(LogLevel logLevel = LogLevel.Information)
		{
			this.LogLevel = logLevel;
		}

		public IDisposable BeginScope<TState>(TState state)
		{
			return Disposable.Empty;
		}

		public bool IsEnabled(LogLevel logLevel)
		{
			return logLevel >= this.LogLevel;
		}

		public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
		{
			if (!IsEnabled(logLevel))
				return;

			var source = exception == null ? typeof(T).Name : exception.TargetSite.DeclaringType.Name;
			Trace.WriteLine($"[{source}] {formatter(state, exception)}\r\n");
		}

		private class Disposable : IDisposable
		{
			public static Disposable Empty { get; } = new Disposable();

			public void Dispose()
			{
			}
		}
	}
}
