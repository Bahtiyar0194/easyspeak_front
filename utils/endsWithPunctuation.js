export function endsWithPunctuation(str) {
    if(str && str.length){
        return /[.,!?]$/.test(str);
    }
    else{
        return '';
    }
};

export function removePunctuation(str) {
    if(str && str.length){
        return str.replace(/[.,!?]/g, '');
    }
    else{
        return '';
    }
};