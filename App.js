/* Developed By Luezoid Technologies Private Limited
*
*
* Author --- Demon Fox
* */

import React from 'react';
import {
    CameraRoll,
    StyleSheet,
    Dimensions,
    FlatList,
    Image,
    ImageEditor,
    ImageStore,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import PopupDialog, {SlideAnimation} from "react-native-popup-dialog";
let photosArray = [];
import renderIf from "render-if";
import {Camera, Permissions} from "expo";
import ImageTile from "./components/image-tile";
const slideAnimation = new SlideAnimation({
    slideFrom: "bottom"
});

const {width, height} = Dimensions.get("window");
const HEADERS = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json"
};
export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showExpandedCamera: false,
            showImagePopup: false,
            showCapturedImage: false,
            showLoader: false,
            isFirstForImages: true,
            totalImageCount: 0,
            images: this.props.images ? JSON.parse(JSON.stringify(this.props.images)) : [],
            imageToBeUploaded: 0,
            imagesToUpload: []
        };
        this.callImages();
    }

    translate = (str) => {
        return str;
    };
    async callImages() {
        if (!this.state.hasCameraPermission) {
            const {status} = await Permissions.askAsync(Permissions.CAMERA);
            this.setState({hasCameraPermission: status === "granted"});
            if (status !== "granted") {
                alert("Unable to access Camera");
            }
        }
        if (!this.state.hasCameraRollPermission) {
            const {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            this.setState({hasCameraRollPermission: status === "granted"});
            if (status !== "granted") {
                alert("Unable to access Storage");
            }
        }
        if (this.state.hasCameraRollPermission) {
            this._getPhotosAsync().catch(error => {
            });
        }
    }

    uploadImage(photos) {
        this.popupDialog.dismiss();

        for (let i in photos) {
            // Image.getSize(photos[i].uri, (width, height) => {
            const widthTemp = photos[i].width;
            const heightTemp = photos[i].height;
            let widthFinal = widthTemp;
            let heightFinal = heightTemp;
            let imageSettings = {
                offset: {x: 0, y: 0},
                size: {width: widthFinal, height: heightFinal}
            };
            ImageEditor.cropImage(photos[i].uri, imageSettings, (uri) => {
                ImageStore.getBase64ForTag(uri, (data) => {
                    // data == base64 encoded image
                    let obj = {};
                    if (photos[i].filename) {
                        obj = {
                            dataURL: ("data:image/" + photos[i].filename.split(".")[photos[i].filename.split(".").length - 1] + ";base64," + data)
                        };
                    } else {
                        obj = {
                            dataURL: ("data:" + photos[i].type + ";base64," + data)
                        };
                    }
                    obj.name = (new Date().getTime()) + (photos[i].filename ? photos[i].filename : "." + photos[i].type.split("/")[1]);

                    if (this.state.images.indexOf(obj.name) > -1) {
                        obj.name = this.state.images.indexOf(obj.name) + obj.name;
                    }

                    // Upload Request

                    fetch("<<API to Upload>>", {
                        method: "POST",
                        body: JSON.stringify(obj),
                        headers: HEADERS,
                    }).then(r => r.json()).then(res => {
                        if (this.state.imageToBeUploaded === 1) {
                            const images = this.state.images;
                            images.push(res.data);
                            this.setState({
                                imageToBeUploaded: 0,
                                showExpandedCamera: false,
                                capturedImage: null,
                                showCapturedImage: false,
                                showLoader: false,
                                images: images,
                            });
                        } else {
                            const images = this.state.images;
                            images.push(res.data);

                            this.setState({
                                imageToBeUploaded: this.state.imageToBeUploaded - 1,
                                images: images,
                                totalImageCount: this.state.totalImageCount - 1
                            });

                        }
                    }).catch(err => {
                        console.log("uploaded failed", err);
                        if (this.state.imageToBeUploaded === 1) {
                            this.setState({
                                imageToBeUploaded: 0,
                                showExpandedCamera: false,
                                capturedImage: null,
                                showCapturedImage: false,
                            });
                        } else {
                            this.setState({
                                imageToBeUploaded: this.state.imageToBeUploaded - 1,
                                totalImageCount: this.state.totalImageCount - 1
                            });
                        }
                    });
                }, e => console.warn("getBase64ForTag: ", e));
            }, e => console.warn("cropImage: ", e));
        }
        if (!photos.length) {
            this.setState({
                imageToBeUploaded: 0,
                showExpandedCamera: false,
                capturedImage: null,
                showCapturedImage: false,
                showLoader: false
            });
        }
    }

    async _getPhotosAsync() {
        let photosTemp = await CameraRoll.getPhotos({first: 500});
        let photos = [];
        if (photosTemp.edges[0].node.image) {
            for (let i in photosTemp.edges) {
                photosTemp.edges[i].node.image.type = photosTemp.edges[i].node.type;
                photos.push(photosTemp.edges[i].node.image);
            }
        } else {
            photos = photosTemp;
        }
        const imageArray = [];
        for (let i = 0; i < photos.length; i++) {
            imageArray.push({key: i + "-a"});
        }
        console.log(photos[0]);
        photosArray = photos;
        this.setState({
            imagesWrapper: imageArray,
            selectedIndex: 1
        });

    }

    componentDidMount() {

    }

    openPicker() {

    }

    toggleCameraMode = () => {
        this.setState({showExpandedCamera: true}, () => {
            this.popupDialog.show(() => {

            });
        });

    };

    snap = () => {

        if (this.state.captureLoader) {
            return;
        }
        this.setState({captureLoader: true}, async () => {
            const options = {quality: 0.5};
            // const data = await this.camera.getAvailablePictureSizesAsync();
            const data = await this.camera.takePictureAsync(options);
            data.type = "image/jpeg";
            this.setState({showCapturedImage: true, capturedImage: data, captureLoader: false});
        });


    };
    _pickImage = async () => {

    };

    callImagePopup = () => {
        this.setState({showImagePopup: !this.state.showImagePopup});
    };
    toggleImageSelect = (item, index) => {
        let images = this.state.imagesWrapper;
        images[index].selected = !images[index].selected;
        if (images[index].selected) {
            images[index].selectedIndex = this.state.selectedIndex;
            this.setState({
                imagesWrapper: JSON.parse(JSON.stringify(images)),
                selectedIndex: this.state.selectedIndex + 1
            });
        } else {
            images.forEach((i) => {
                if (i.selectedIndex > images[index].selectedIndex) {
                    i.selectedIndex -= 1;
                }
            });
            images[index].selectedIndex = -1;
            this.setState({
                imagesWrapper: JSON.parse(JSON.stringify(images)),
                selectedIndex: this.state.selectedIndex - 1
            });
        }
    };
    _renderItem = ({index, item}) => {
        const isArabic = false;
        return (
            <TouchableOpacity onPress={() => this.toggleCameraMode()} style={{height: 100, width: 100}}>
                {index === 0 ? <View style={{
                        height: 98,
                        width: 98,
                        margin: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#666666",
                        borderRadius: 10
                    }}>
                        <TouchableOpacity
                            onPress={() => this.toggleCameraMode()}
                            style={{
                                position: "absolute",
                                height: 98,
                                width: 98,
                                top: 0,
                                left: 0,
                                borderRadius: 15,
                                overflow: "hidden"
                            }}>
                            {!this.state.showExpandedCamera ? <Camera style={{flex: 1}}
                                                                      type={this.state.type}
                                                                      ratio={"1:1"}>
                            </Camera> : <View/>}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.toggleCameraMode()}
                            style={{}}>
                            {/*<Icon style={{*/}
                                {/*fontSize: 40,*/}
                                {/*color: "white",*/}
                                {/*textAlign: "center"*/}
                            {/*}} name="camera"/>*/}
                            <Text>Camera</Text>
                        </TouchableOpacity>
                    </View> :
                    <View style={{height: 98, width: 98, margin: 1, backgroundColor: "#eeeeee", borderRadius: 10}}>
                        <TouchableOpacity
                            onPress={() => this.toggleImageSelect(item, index)}
                            style={{
                                position: "absolute",
                                height: 98,
                                width: 98,
                                top: 0,
                                left: 0,
                                borderRadius: 15,
                                overflow: "hidden",
                                backgroundColor: "blue"
                            }}>

                            <ImageTile source={photosArray[index]}/>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => this.toggleImageSelect(item, index)}
                            style={{
                                position: "absolute",
                                height: 30,
                                width: 30,
                                top: 2,
                                right: 2,
                                borderColor: "white",
                                backgroundColor: item.selected ? "green" : "transparent",
                                borderWidth: 2,
                                borderRadius: 15
                            }}>
                            {item.selected ?
                                <Text style={{
                                    fontSize: 21,
                                    color: "white",
                                    textAlign: "center"
                                }}>{item.selectedIndex}</Text> :
                                <View/>}
                        </TouchableOpacity>


                    </View>}
            </TouchableOpacity>
        );
    };
    removeImageFromIndex = (index) => {
        let images = this.state.images;
        let selectedImageIndex = this.state.selectedImageIndex;
        images.splice(index, 1);
        if (selectedImageIndex === index || selectedImageIndex > index) {
            selectedImageIndex = selectedImageIndex - 1;
        }
        this.setState({images: images, selectedImageIndex: selectedImageIndex});
    };
    imageUploadFromGallery = () => {
        const images = [];
        let imagesWrapper = JSON.parse(JSON.stringify(this.state.imagesWrapper));
        for (let i in imagesWrapper) {
            if (imagesWrapper[i].selected) {
                images.push(photosArray[i]);
                delete imagesWrapper[i]["selected"];
                delete imagesWrapper[i]["selectedIndex"];
            }
        }
        this.setState({
            showImagePopup: !this.state.showImagePopup,
            showLoader: true,
            imagesWrapper: imagesWrapper,
            imageToBeUploaded: images.length,
            selectedIndex: 1
        }, () => {
            this.uploadImage(images);
        });
    };

    render() {
        const images = [];
        if (this.state.images && this.state.images.length) {

            for (let i in this.state.images) {
                //Push Image URL to populate Uploaded images
                // images.push();
            }
        }
        const renderImagesPopup = renderIf(this.state.showImagePopup);
        const flexDirection = {flexDirection: "row"};
        return (
            <View style={{backgroundColor: "white", flex: 1}}>

                <SafeAreaView style={{flex: 1}}>
                    <PopupDialog
                        ref={popupDialog => {
                            this.popupDialog = popupDialog;
                        }}
                        width={1}
                        containerStyle={{zIndex: 1000, backgroundColor: "black"}}
                        dialogStyle={{height}}
                        dialogAnimation={slideAnimation}
                        dismissOnTouchOutside={false}>
                        {
                            this.state.showExpandedCamera && !this.state.showCapturedImage ?
                                <Camera style={{flex: 1}}
                                        ratio={"3:4"}
                                        ref={ref => {
                                            this.camera = ref;
                                        }}
                                        type={this.state.type}>
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: this.state.captureLoader ? "white" : "transparent",
                                            flexDirection: "row"
                                        }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                alignSelf: "flex-start",

                                                paddingTop: 5
                                            }}
                                            onPress={() => {
                                                this.popupDialog.dismiss();
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 20,
                                                    marginBottom: 10,
                                                    padding: 10,
                                                    color: "white"
                                                }}>
                                                {" "}X{" "}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: this.state.captureLoader ? "white" : "transparent",
                                            flexDirection: "row",
                                            paddingBottom: 50
                                        }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                alignSelf: "flex-end",
                                                alignItems: "center",
                                                paddingTop: 5
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    type: this.state.type === Camera.Constants.Type.back
                                                        ? Camera.Constants.Type.front
                                                        : Camera.Constants.Type.back,
                                                });
                                            }}>

                                        </TouchableOpacity>
                                        <View
                                            style={{
                                                flex: 1,
                                                alignSelf: "flex-end",
                                                alignItems: "center",
                                                paddingTop: 5
                                            }}>
                                            <TouchableOpacity
                                                onPress={() => this.snap()}
                                                style={{
                                                    height: 50,
                                                    width: 50,
                                                    borderRadius: 25,
                                                    borderColor: "white",
                                                    borderWidth: 3,
                                                    padding: 2,
                                                    backgroundColor: "black"
                                                }}>
                                                <View style={{
                                                    height: 40,
                                                    width: 40,
                                                    borderRadius: 20,
                                                    backgroundColor: "white"
                                                }}>

                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                alignSelf: "flex-end",
                                                alignItems: "center",
                                                paddingTop: 5
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    isCameraExpanded: !this.state.isCameraExpanded
                                                });
                                            }}>

                                        </TouchableOpacity>
                                    </View>
                                </Camera> : <View style={{flex: 1}}>
                                    <Image
                                        style={{flex: 1, resizeMode: "contain"}}
                                        source={{uri: this.state.capturedImage ? this.state.capturedImage.uri : ""}}
                                    />
                                    <View
                                        style={{
                                            flex: 1,
                                            position: "absolute",
                                            bottom: 0,

                                            backgroundColor: "transparent",
                                            flexDirection: "row",
                                            paddingBottom: 50
                                        }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({
                                                    showExpandedCamera: true,
                                                    showCapturedImage: false,
                                                    capturedImage: null
                                                });
                                            }}
                                            style={{
                                                flex: 1,
                                                alignSelf: "flex-end",
                                                alignItems: "center",
                                                padding: 2
                                            }}>

                                            <Text>Remove</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({showLoader: true, imageToBeUploaded: 1}, () => {
                                                    this.uploadImage([this.state.capturedImage]);
                                                });
                                            }}
                                            style={{
                                                flex: 1,
                                                alignSelf: "flex-end",
                                                alignItems: "center",
                                                padding: 2
                                            }}>

                                            <Text>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>}
                    </PopupDialog>
                    <View style={{backgroundColor: "white"}}>
                        <View style={[{
                            backgroundColor: "white",
                            padding: 10,
                            marginTop: 55,
                            flexWrap: "wrap"
                        }, flexDirection]}>
                            {/*// upload image and slide show goes here*/}
                            {images.map((image, key) => {
                                return <View style={{
                                    width: ((width - 20) / 4),
                                    height: ((width - 20) / 4),
                                    borderRadius: 10,
                                    padding: 2,
                                    overflow: "hidden"
                                }}>

                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: "white",
                                            flexDirection: "row",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            flexWrap: "wrap"
                                        }}>
                                        <Image
                                            source={{
                                                uri: image
                                            }}
                                            resizeMode="white"
                                            style={{
                                                borderColor: "#fff",
                                                height: ((width - 20) / 4 - 4),
                                                width: ((width - 20) / 4 - 4),
                                                backgroundColor: "#ededed",
                                                borderRadius: 5,
                                                resizeMode: "contain"
                                            }}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => this.removeImageFromIndex(key)}
                                        style={{
                                            position: "absolute",
                                            left: 0
                                        }}>
                                        <Text>Close</Text>
                                    </TouchableOpacity>
                                </View>;
                            })}
                            <TouchableOpacity
                                onPress={() => this.callImagePopup()}>
                                <View style={{
                                    width: ((width - 20) / 4),
                                    height: ((width - 20) / 4),
                                    backgroundColor: "white",
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    borderWidth: 1,
                                    borderColor: "#777777",
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}>
                                    <Text>Camera</Text>
                                    <Text
                                        style={{
                                            color: "rgba(0,0,0,0.7)",
                                            fontSize: 16,
                                            textDecorationLine: "underline"
                                        }}>{this.translate("Add Photos")}</Text>
                                </View>
                            </TouchableOpacity>

                        </View>
                    </View>
                    {renderImagesPopup(
                        <View style={{
                            backgroundColor: "white",
                            border: "none",
                            paddingTop: 5,
                            height: 170,
                            position: "absolute",
                            bottom: 0
                        }}>
                            <FlatList
                                data={this.state.imagesWrapper}
                                horizontal={true}
                                renderItem={this._renderItem}/>
                            <View style={{width: "100%", padding: 10, alignItems: "center"}}>
                                <View
                                    onPress={() => {
                                        this.imageUploadFromGallery();
                                    }}
                                    style={{
                                        width: "80%",
                                        textAlign: "center",
                                        alignSelf: "center",
                                        backgroundColor: "#f79523",
                                        justifyContent: "center"
                                    }}
                                    rounded>
                                    <Text
                                        style={{
                                            color: "white",
                                            fontSize: 18
                                        }}>{this.translate("Add Photos")}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            </View>
        );
    }
}