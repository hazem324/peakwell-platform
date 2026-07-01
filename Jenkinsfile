pipeline {
    agent any

    stages {

        stage('Checkout Source Code') {
            steps {
                cleanWs()

                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/hazem324/peakwell-platform.git',
                        credentialsId: 'github'
                    ]]
                ])
            }
        }

        stage('Verify Build Environment') {
            steps {
                sh '''
                    set -e

                    echo "========== Build Environment =========="

                    echo "Git Version:"
                    git --version

                    echo ""

                    echo "Docker Version:"
                    docker version

                    echo ""

                    echo "Java Version:"
                    java -version

                    echo ""

                    echo "Maven Version:"
                    mvn -version

                    echo ""

                    echo "Node.js Version:"
                    node -v

                    echo ""

                    echo "NPM Version:"
                    npm -v

                    echo "======================================="
                '''
            }
        }

        stage('Build Applications') {

            parallel {

                stage('Build Frontend') {
                    steps {
                        dir('PI-Cloud-Frontend') {
                            sh '''
                                set -e

                                echo "Building Angular Frontend..."

                                npm ci --legacy-peer-deps
                                npm run build

                                echo "Frontend build completed."
                            '''
                        }
                    }
                }

                stage('Build Backend') {
                    steps {
                        dir('PI-Cloud-Backend') {
                            sh '''
                                set -e

                                echo "Building Spring Boot Backend..."

                                chmod +x mvnw
                                ./mvnw clean package -DskipTests

                                echo "Backend build completed."
                            '''
                        }
                    }
                }

                stage('Build AI Service 1') {
                    steps {
                        dir('ai-servs/achref') {
                            sh '''
                                set -e

                                echo "Validating AI Service 1..."

                                python3 -m py_compile mainv2.py

                                echo "AI Service 1 validation completed."
                            '''
                        }
                    }
                }

                stage('Build AI Service 2') {
                    steps {
                        dir('ai-servs/adem') {
                            sh '''
                                set -e

                                echo "Validating AI Service 2..."

                                python3 -m py_compile app.py

                                echo "AI Service 2 validation completed."
                            '''
                        }
                    }
                }

                stage('Build AI Service 3') {
                    steps {
                        dir('ai-servs/feryel') {
                            sh '''
                                set -e

                                echo "Validating AI Service 3..."

                                python3 -m py_compile api.py

                                echo "AI Service 3 validation completed."
                            '''
                        }
                    }
                }

                stage('Build AI Service 4') {
                    steps {
                        dir('ai-servs/oussema') {
                            sh '''
                                set -e

                                echo "Validating AI Service 4..."

                                python3 -m py_compile api.py

                                echo "AI Service 4 validation completed."
                            '''
                        }
                    }
                }
            }
        }
    }
}