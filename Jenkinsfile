pipeline {
    agent any

    environment {
        IMAGE_TAG = "v${BUILD_NUMBER}"
    }

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

                    echo "Git Version:"
                    git --version

                    echo ""

                    echo "Docker Version:"
                    docker version

                    echo ""

                    echo "Docker Compose Version:"
                    docker compose version

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

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -e

                    export IMAGE_TAG=${IMAGE_TAG}

                    echo "Building Docker Images"
                    echo "Build Number : ${BUILD_NUMBER}"
                    echo "Image Tag    : ${IMAGE_TAG}"

                    docker compose config
                    docker compose build
                '''
            }
        }

        stage('Push Docker Images') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "$DOCKER_PASS" | docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin

                        echo "Pushing Backend Image..."
                        docker push hazem231/peakwell-backend:${IMAGE_TAG}

                        echo "Pushing Frontend Image..."
                        docker push hazem231/peakwell-frontend:${IMAGE_TAG}

                        echo "Pushing Allergen Predictor Image..."
                        docker push hazem231/allergen-predictor:${IMAGE_TAG}

                        echo "Pushing AI Event Image..."
                        docker push hazem231/ai-event:${IMAGE_TAG}

                        echo "Pushing AI Booking Image..."
                        docker push hazem231/ai-booking:${IMAGE_TAG}

                        echo "Pushing Symptom Predictor Image..."
                        docker push hazem231/peakwell-symptom-predictor:${IMAGE_TAG}

                        docker logout

                        echo "All Docker Images Pushed Successfully"
                        
                    '''
                }
            }
        }
    }

    post {

        success {
            echo 'CI Pipeline completed successfully.'
        }

        failure {
            echo 'CI Pipeline failed.'
        }

        always {
            cleanWs()
        }
    }
}