using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Windows;

namespace BridgeClient.DataModel
{
    class VFS
    {
        private readonly Dictionary<string, string> m_vfsPaths = new Dictionary<string, string>();
        private readonly VFSSettings _settings;

        public VFS(VFSSettings settings)
        {
            _settings = settings;

            DetectFSInstallationType();

            foreach (var path in _settings.Source)
            {
                var resolvedPath = Environment.ExpandEnvironmentVariables(path);
                bool isSuccess = false;
                try
                {
                    isSuccess = Directory.Exists(resolvedPath);
                }
                catch (Exception ex)
                {
                    Trace.WriteLine($"VFS: Error acessing {path}: {ex}");
                }

                if (!isSuccess)
                {
                    MessageBox.Show($"Error: Path not accessible:\n\n'{path}'\n\n'{resolvedPath}'\n\nEdit settings.json with the correct path");
                    Environment.Exit(0);
                }

                if (isSuccess)
                {
                    if (!IsPathPackageSource(resolvedPath))
                    {
                        var warning = $"Warning: Path does not appear to be a packace source:\n\n{resolvedPath}\n\nEdit settings.json with the correct path";
                        Trace.WriteLine("VFS: " + warning);
                        MessageBox.Show(warning);
                    }
                }
            }

            MapAndAddPackagesFromSettings();
        }

        // Has at least one package and no exceptions
        private bool IsPathPackageSource(string path)
        {
            bool isValid = false;
            try
            {
                var packagesDirs = Directory.GetDirectories(path);
                foreach (var pkgDir in packagesDirs)
                {
                    isValid = isValid || File.Exists(Path.Combine(pkgDir, "layout.json"));
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine(ex);
                isValid = false;
            }
            return isValid;
        }

        public IEnumerable<string> FindFiles(Func<string, bool> isFileIncluded)
        {
            var files = m_vfsPaths.Keys.Where((f) => isFileIncluded(f));
            return files;
        }

        public string Resolve(string path)
        {
            path = path.Replace("/", @"\").ToLower().Trim();
            return m_vfsPaths.ContainsKey(path) ? m_vfsPaths[path] : null;
        }

        public void AddPackageDirectory(string dirPath)
        {
            dirPath = Environment.ExpandEnvironmentVariables(dirPath);
            Trace.WriteLine($"VFS: Loading packages from {dirPath}");

            var packageDirs = Directory.GetDirectories(dirPath);
            foreach (var packageFolder in packageDirs)
            {
                Add(packageFolder);
            }
            Trace.WriteLine($"VFS: Added {packageDirs.Length} packages");
        }

        private void Add(string path)
        {
            foreach (var filePath in Directory.GetFiles(path, "*", SearchOption.AllDirectories))
            {
                var vfsFilePath = Path.Combine(Path.GetFileName(filePath)).ToLower().Trim();
                m_vfsPaths[vfsFilePath] = filePath;
            }
        }

        private void DetectFSInstallationType()
        {
            if (_settings.Source == null)
            {
                Trace.WriteLine("VFS: settings.json: No explicit VFS.Source specified");
                var storePath = Environment.ExpandEnvironmentVariables(@"%LocalAppData%\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe");
                var isStore = Directory.Exists(storePath);
                Trace.WriteLine("VFS: FS Installation type is detected as: " + (isStore ? "Windows Store" : "Steam"));

                _settings.Source = isStore ? _settings.Templates.WindowsStore : _settings.Templates.Steam;
            }
        }

        private void MapAndAddPackagesFromSettings()
        {
            for (var i = 0; i < _settings.Source.Length; i++)
            {
                var source = Environment.ExpandEnvironmentVariables(_settings.Source[i]);
                AddPackageDirectory(source);
            }

            var repoRoot = Directory.GetParent(Assembly.GetExecutingAssembly().Location).Parent.Parent.FullName;
            AddPackageDirectory(Path.Combine(repoRoot, "fs-package"));
            AddPackageDirectory(Path.Combine(repoRoot, "fs-package", "PackageSources", "ExternalPackages"));
        }
    }
}
