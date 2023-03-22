

export function parse_row(row: string) {
    return row.split('|').map((value) => {
        return fix_name(value.trim().split(' ').slice(1).join(' '));
    });
}

function fix_name(name: string ) {
    if (name === 'USC') {
        return "Southern California"
    }
    if (name === 'VCU') {
        return "Virginia Commonwealth"
    }
    if (name === 'UConn') {
        return "Connecticut"
    }
    if (name === 'TCU') {
        return "Texas Christian"
    }
    return name;
}

export function normalcdf(mean: number, sigma: number, to: number) 
{
    var z = (to-mean)/Math.sqrt(2*sigma*sigma);
    var t = 1/(1+0.3275911*Math.abs(z));
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
    var sign = 1;
    if(z < 0)
    {
        sign = -1;
    }
    return (1/2)*(1+sign*erf);
}