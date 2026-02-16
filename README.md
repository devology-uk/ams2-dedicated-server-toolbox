# AMS2 Dedicated Server Toolbox

Provides a cross platform desktop application aimed at making it easier to configure an Automobilista 2 Dedicated Server and view the results of multiplayer sessions.  It includes the following features.

## API Explorer
Allows you to connect to the HTTP API of your server to read and cache data from all of the endpoints.  The cached data is presented as a tree structure representing the endpoint hierarchy provided by the HTTP Server.

## Config Builder
Allows you to create a configuration set that works for your server then export to a local file.  The tool also allows you to import an existing file as a starting point or simply to analyse it.

## Stats Viewer
Allows you to open a file produced by the **sms_stats** plugin and analyse the contents.  Once opened a file can be imported to the application database making the data available to the Results Viewer.

## Results Viewer
Allows you to import a file produced by the **sms_stats** plugin to update the application database with any new stage (Practice, Qualifying or Race) results.  It is intelligent enough to recognise results it has already imported and avoids creating duplicates.

## Documentation
AMS2 Dedicated Server Toolbox is brought to you by the Sim Racer Tools team. Documentation for the application and the individual tools is available at [Sim Racer Tools -> AMS2 Dedicated Server Toolbox](https://www.simracertools.com/docs/ams2-dedi-getting-started/)


## Contributing

Contributions are welcome! If you'd like to help improve the toolbox, please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Make your changes and commit them with clear, descriptive messages
4. Push your branch to your fork (`git push origin feature/your-feature-name`)
5. Open a Pull Request against the `master` branch of this repository

### Guidelines

- Please open an issue first to discuss significant changes before starting work
- Keep pull requests focused on a single feature or fix
- Follow the existing code style and conventions
- Test your changes locally before submitting

### Development Setup

#### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [npm](https://www.npmjs.com/) (included with Node.js)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) is the recommended editor for this project

#### Getting Started

```bash
# Clone your fork
git clone https://github.com/<your-username>/ams2-dedicated-server-toolbox.git

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
