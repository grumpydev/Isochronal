using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace NancySample
{
    using System.Diagnostics;

    class Program
    {
        static void Main(string[] args)
        {
            var host = new Nancy.Hosting.Self.NancyHost(new Uri("http://localhost:8888/Nancy/"));
            host.Start();
            Process.Start("http://localhost:8888/Nancy/");
            Console.WriteLine("Press [ENTER] to stop");
            Console.ReadLine();
            host.Stop();
        }
    }
}
