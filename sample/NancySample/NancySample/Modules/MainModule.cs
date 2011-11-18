namespace NancySample.Modules
{
    using System;

    using Nancy;

    public class MainModule : NancyModule
    {
        public MainModule()
        {
            Get["/"] = _ => View["index"];

            Get["/clock"] = _ => DateTime.Now.ToShortTimeString();
        }
    }
}