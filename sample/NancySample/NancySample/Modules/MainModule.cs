namespace NancySample.Modules
{
    using System;

    using Nancy;

    public class MainModule : NancyModule
    {
        public MainModule()
        {
            Get["/"] = _ => View["index"];

            Get["/clock"] = _ => ((Response)DateTime.Now.ToShortTimeString()).WithHeader("Isochronal-Timeout", "500-5000");
        }
    }
}