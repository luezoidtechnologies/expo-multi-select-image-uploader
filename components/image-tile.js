import React, {Component} from "react";
import {ImageView, Text, TouchableOpacity, View, Image} from "react-native";

class ImageTile extends Component {
    render() {
        return (
            <View style={{
                height: 100,
                width: 100
            }}>
                <Image
                    source={this.props.source}
                    style={{
                        borderColor: "#fff",
                        height: 98,
                        width: 98,
                        backgroundColor: "#ededed",
                        resizeMode: "cover"
                    }}
                />
            </View>
        );
    }
}

export default ImageTile;
