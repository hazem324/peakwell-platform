pipeline {
    agent any 
    stages {
        stage('Checkout Source Code') {
    steps {
        cleanWs() // Cleans the workspace before pulling fresh code
        checkout([
            $class: 'GitSCM', 
            branches: [[name: '*/main']], //  branch name
            userRemoteConfigs: [[
                url: 'https://github.com/hazem324/peakwell-platform.git',
                credentialsId: 'github' 
            ]]
        ])
    }
}
    }
}
