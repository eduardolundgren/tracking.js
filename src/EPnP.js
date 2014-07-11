(function() {
  /**
   * EPnp utility.
   * @static
   * @constructor
   */
  tracking.EPnP = function () {
  };

  tracking.EPnP.prototype.initPoints = function(objectPoints, imagePoints) {
    var instance = this,
        numberOfCorrespondences = instance.numberOfCorrespondences,
        pws = instance.pws,
        us = instance.us;

    for(var i = 0; i < numberOfCorrespondences; i++)
    {
      pws[3 * i    ] = objectPoints[i].x;
      pws[3 * i + 1] = objectPoints[i].y;
      pws[3 * i + 2] = objectPoints[i].z;

      us[2 * i    ] = imagePoints[i].x*instance.fu + instance.uc;
      us[2 * i + 1] = imagePoints[i].y*instance.fv + instance.vc;
    }
  };

  tracking.EPnP.prototype.initCameraParameters = function(cameraMatrix) {
    var instance = this;

    instance.uc = cameraMatrix[0*3 + 2];
    instance.vc = cameraMatrix[1*3 + 2];
    instance.fu = cameraMatrix[0*3 + 0];
    instance.fv = cameraMatrix[1*3 + 1];
  };

  tracking.EPnP.prototype.init = function(objectPoints, imagePoints, cameraMatrix) {
    var instance = this,
        numberOfCorrespondences = objectPoints.length;

    instance.initCameraParameters(cameraMatrix);

    instance.numberOfCorrespondences = numberOfCorrespondences;
    instance.pws = new Float64Array(3*numberOfCorrespondences);
    instance.us = new Float64Array(2*numberOfCorrespondences);

    instance.initPoints(objectPoints, imagePoints);

    instance.alphas = new Float64Array(4*numberOfCorrespondences);
    instance.pcs = new Float64Array(3*numberOfCorrespondences);

    instance.max_nr = 0;
  };

  // Decompose a m x n matrix using SVD
  tracking.EPnP.prototype.svd = function(A, m, n, W, U, V) {
    var matrix = [], i, j;

    for (i = 0; i < m; i++) {
      matrix.push([]);
      for (j = 0; j < n; j++) {
        matrix[i].push(A[i*n+j]);
      }
    }
    
    var output = numeric.svd(matrix),
        w = output.S,
        u = output.U,
        v = output.V;

    if (W) {
      for (i = 0; i < w.length; i++) {
        W[i] = w[i];
      }
    }

    if (U) {
      for (i = 0; i < m; i++) {
        for (j = 0; j < m; j++) {
          U[i*m + j] = u[i][j];
        }
      }
    }

    if (V) {
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          V[i*n + j] = v[i][j];
        }
      }
    }
  };

  tracking.EPnP.prototype.invertSquare = function(src, n, dst) {
    var matrix = [], i, j;

    for (i = 0; i < n; i++) {
      matrix.push([]);
      for (j = 0; j < n; j++) {
        matrix[i].push(src[i*n+j]);
      }
    }

    matrix = numeric.inv(matrix);

    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        dst[i*n + j] = matrix[i][j];
      }
    }
  };

  tracking.EPnP.prototype.transpose = function(A, m, n, dst) {
    var i, j;
    for (i = 0; i < m; i++) {
      for (j = 0; j < n; j++) {
        dst[j*m+i] = A[i*n+j];
      }
    }
  };

  tracking.EPnP.prototype.multiply = function(A, B, m, n, o, dst) {
    var i, j, k;

    for (i = 0; i < m; i++) {
      for (j = 0; j < o; j++) {
        dst[i*o + j] = 0;
        for (k = 0; k < n; k++) {
          dst[i*o + j] += A[i*n+k]*B[k*o+j];
        }
      }
    }
  };

  tracking.EPnP.prototype.transposeSquare = function(A, n) {
    var i, j, temp;

    for (i = 1; i < n; i++) {
      for (j = 0; j < i; j++) {
        temp = A[i*n+j];
        A[i*n+j] = A[j*n+i];
        A[j*n+i] = temp;
      }
    }
  };

  // Calculates the product of a m x n matrix and its transposition.
  tracking.EPnP.prototype.mulTransposed = function(src, m, n, dst, order) {
    var i, j, k;
    if(order) {
      // dst = srct x src
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          dst[i*n + j] = 0;
          for (k = 0; k < m; k++) {
            dst[i*n + j] += src[k*n+i]*src[k*n+j];
          }
        }
      }
    }
    else {
      // dst = src x srct
      for (i = 0; i < m; i++) {
        for (j = 0; j < m; j++) {
          dst[i*n + j] = 0;
          for (k = 0; k < n; k++) {
            dst[i*n + j] += src[i*n+k]*src[j*n+k]; 
          }
        }
      }
    }
  };

  // Solves a linear system Ax = b
  tracking.EPnP.prototype.solveLinearSystem = function(A, m, n, b, dst) {
    var leftSide = [], 
        rightSide = [],
        i, j;

    var At = new Float64Array(n * m),
        AtA = new Float64Array(n * n),
        Atb = new Float64Array(n);

    this.transpose(A, m, n, At);
    this.multiply(At, A, n, m, n, AtA);
    this.multiply(At, b, n, m, 1, Atb);

    //var vars = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (i = 0; i < n; i++) {
      leftSide.push([]);
      for (j = 0; j < n; j++) {
        leftSide[i].push(AtA[i*n+j]);
      }
      rightSide.push(Atb[i]);
    }

    /*
    for (i = 0; i < m; i++) {
      leftSide.push([]);
      for (j = 0; j < n; j++) {
        leftSide[i].push(A[i*n+j]);
      }
      rightSide.push(b[i]);
    }*/
    
   
   // console.log('A', JSON.stringify(leftSide));
   // console.log('b', JSON.stringify(rightSide));

    var output = numeric.solve(leftSide, rightSide);

    for (i = 0; i < n; i++) {
      dst[i] = output[i];
    }

    /*/ <DEBUG>

    var temp = new Float64Array(m);
    console.log('Ax');
    this.multiply(A, dst, m, n, 1, temp);
    console.log(temp);
    console.log('b');
    console.log(b);


    temp = new Float64Array(n);
    console.log('AtAx');
    this.multiply(AtA, dst, n, n, 1, temp);
    console.log(temp);
    console.log('Atb');
    console.log(Atb);

    var inv = new Float64Array(n*n);
    var temp2 = numeric.inv(leftSide);
    for (i = 0; i < n; i++) {
      for (j= 0; j < n; j++) {
        inv[i*n+j] = temp2[i][j];
      }
    }
    var temp3 = new Float64Array(m);
    this.multiply(inv, Atb, n, n, 1, temp);
    this.multiply(A, temp, m, n, 1, temp3);
    console.log(' temp3');
    console.log(temp3);
    // </DEBUG> //*/
  };

  tracking.EPnP.prototype.chooseControlPoints = function() {
    var instance = this,
        cws = new Float64Array(4*3),
        numberOfCorrespondences = instance.numberOfCorrespondences,
        pws = instance.pws,
        i,
        j;

    instance.cws = cws;

    // Take C0 as the reference points centroid:
    cws[0] = cws[1] = cws[2] = 0;

    for(i = 0; i < numberOfCorrespondences; i++) {
      for(j = 0; j < 3; j++) {
        cws[0*3 + j] += pws[3*i + j];
      }
    }

    for(j = 0; j < 3; j++){
      cws[0*3 + j] /= numberOfCorrespondences;
    }

    // Take C1, C2, and C3 from PCA on the reference points:
    var PW0 = new Float64Array(numberOfCorrespondences*3),
        PW0tPW0 = new Float64Array(3 * 3),
        DC = new Float64Array(3),
        UCt = new Float64Array(3 * 3);

    for(i = 0; i < numberOfCorrespondences; i++) {
      for(j = 0; j < 3; j++) {
        PW0[3 * i + j] = pws[3 * i + j] - cws[0 * 3 + j];
      }
    }

    instance.mulTransposed(PW0, numberOfCorrespondences, 3, PW0tPW0, 1);

    instance.svd(PW0tPW0, 3, 3, DC, UCt, 0);
    instance.transposeSquare(UCt, 3);

    for(i = 1; i < 4; i++) {
      var k = Math.sqrt(DC[i - 1] / numberOfCorrespondences);
      for(j = 0; j < 3; j++) {
        cws[i*3 + j] = cws[0*3 + j] + k * UCt[3 * (i - 1) + j];
      }
    }
  };

  tracking.EPnP.prototype.computeBarycentricCoordinates = function() {
    var instance = this,
        alphas = instance.alphas,
        cc = new Float64Array(3*3),
        ccInv = new Float64Array(3*3),
        cws = instance.cws,
        i,
        j,
        pws = instance.pws;

      for(i = 0; i < 3; i++) {
        for(j = 1; j < 4; j++) {
          cc[3 * i + j - 1] = cws[j * 3 + i] - cws[0 * 3 + i];
        }
      }

      instance.invertSquare(cc, 3, ccInv);

      for(i = 0; i < instance.numberOfCorrespondences; i++) {
        var pi = 3 * i,
            a = 4 * i;

        for(j = 0; j < 3; j++) {
          alphas[a + 1 + j] =
            ccInv[3 * j    ] * (pws[pi + 0] - cws[0]) +
            ccInv[3 * j + 1] * (pws[pi + 1] - cws[1]) +
            ccInv[3 * j + 2] * (pws[pi + 2] - cws[2]);
        }
        alphas[a + 0] = 1.0 - alphas[a + 1] - alphas[a + 2] - alphas[a + 3];
      }
    };

    tracking.EPnP.prototype.fillM = function(M, row, as, offset, u, v) {
      var instance = this,
          fu = instance.fu,
          fv = instance.fv,
          uc = instance.uc,
          vc = instance.vc,
          m1 = row * 12,
          m2 = m1 + 12;

      for(var i = 0; i < 4; i++) {
        M[m1 + 3 * i    ] = as[offset + i] * fu;
        M[m1 + 3 * i + 1] = 0.0;
        M[m1 + 3 * i + 2] = as[offset + i] * (uc - u);

        M[m2 + 3 * i    ] = 0.0;
        M[m2 + 3 * i + 1] = as[offset + i] * fv;
        M[m2 + 3 * i + 2] = as[offset + i] * (vc - v);
      }
    };

    tracking.EPnP.prototype.computeCCS = function(betas, ut) {
      var instance = this,
          ccs = new Float64Array(4 * 3),
          i,
          j,
          k;

      instance.ccs = ccs;

      for(i = 0; i < 4; i++) {
        ccs[i*3] = ccs[i*3 + 1] = ccs[i*3 + 2] = 0.0;
      }

      for(i = 0; i < 4; i++) {
        var v = 12 * (11 - i);
        for(j = 0; j < 4; j++){
          for(k = 0; k < 3; k++){
            ccs[j*3 + k] += betas[i] * ut[v + 3 * j + k];
          }
        }
      }
    };

    tracking.EPnP.prototype.computePCS = function() {
      var instance = this,
          alphas = instance.alphas,
          ccs = instance.ccs,
          pcs = new Float64Array(instance.numberOfCorrespondences*3),
          i,
          j;

      instance.pcs = pcs;

      for(i = 0; i < instance.numberOfCorrespondences; i++) {
        var a = 4 * i,
            pc = 3 * i;

        for(j = 0; j < 3; j++){
          pcs[pc + j] = alphas[a + 0] * ccs[0 * 3 + j] + 
                        alphas[a + 1] * ccs[1 * 3 + j] + 
                        alphas[a + 2] * ccs[2 * 3 + j] + 
                        alphas[a + 3] * ccs[3 * 3 + j];
        }
      }
    };

    tracking.EPnP.prototype.computePose = function(R, t) {
      var instance = this,
          numberOfCorrespondences = instance.numberOfCorrespondences,
          i,
          alphas = instance.alphas,
          us = instance.us;

      instance.chooseControlPoints();
      instance.computeBarycentricCoordinates();

      var M = new Float64Array(2 * numberOfCorrespondences * 12);

      for(i = 0; i < numberOfCorrespondences; i++) {
        instance.fillM(M, 2 * i, alphas, 4 * i, us[2 * i], us[2 * i + 1]);
      }

      var MtM = new Float64Array(12*12),
          D = new Float64Array(12),
          Ut = new Float64Array(12*12);

      instance.mulTransposed(M, 2*numberOfCorrespondences, 12, MtM, 1);

      instance.svd(MtM, 12, 12, D, Ut, 0);
      instance.transposeSquare(Ut, 12);

      var L_6x10 = new Float64Array(6 * 10),
          Rho = new Float64Array(6);

      instance.computeL6x10(Ut, L_6x10);
      instance.computeRho(Rho);

      var Betas = [new Float64Array(4), new Float64Array(4), new Float64Array(4), new Float64Array(4)],
          repErrors = new Float64Array(4),
          Rs = [new Float64Array(3*3), new Float64Array(3*3), new Float64Array(3*3), new Float64Array(3*3)],
          ts = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];

      instance.findBetasApprox1(L_6x10, Rho, Betas[1]);
      instance.gaussNewton(L_6x10, Rho, Betas[1]);
      repErrors[1] = instance.computeRAndT(Ut, Betas[1], Rs[1], ts[1]);

      instance.findBetasApprox2(L_6x10, Rho, Betas[2]);
      instance.gaussNewton(L_6x10, Rho, Betas[2]);
      repErrors[2] = instance.computeRAndT(Ut, Betas[2], Rs[2], ts[2]);

      instance.findBetasApprox3(L_6x10, Rho, Betas[3]);
      instance.gaussNewton(L_6x10, Rho, Betas[3]);
      repErrors[3] = instance.computeRAndT(Ut, Betas[3], Rs[3], ts[3]);

      var N = 1;
      if (repErrors[2] < repErrors[1]){
        N = 2;
      }
      if (repErrors[3] < repErrors[N]){
        N = 3;
      }

      instance.copyRAndT(Rs[N], ts[N], R, t);
    };

    tracking.EPnP.prototype.copyRAndT = function(Rsrc, Tsrc, Rdst, Tdst) {
      var i, j;

      for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
          Rdst[3*i + j] = Rsrc[3*i + j];
        }
        Tdst[i] = Tsrc[i];
      }
    };

    tracking.EPnP.prototype.dist2 = function(p1, p1offset, p2, p2offset) {
      return (p1[p1offset+0] - p2[p2offset+0]) * (p1[p1offset+0] - p2[p2offset+0]) +
             (p1[p1offset+1] - p2[p2offset+1]) * (p1[p1offset+1] - p2[p2offset+1]) +
             (p1[p1offset+2] - p2[p2offset+2]) * (p1[p1offset+2] - p2[p2offset+2]);
    };

    tracking.EPnP.prototype.dot = function(v1, v1offset, v2, v2offset) {
      return v1[v1offset+0] * v2[v2offset+0] + 
             v1[v1offset+1] * v2[v2offset+1] + 
             v1[v1offset+2] * v2[v2offset+2];
    };

    tracking.EPnP.prototype.estimateRAndT = function(R, t) {
      var instance = this,
          numberOfCorrespondences = instance.numberOfCorrespondences,
          pc0 = new Float64Array(3),
          pcs = instance.pcs,
          pw0 = new Float64Array(3),
          pws = instance.pws,
          i,
          j,
          pc,
          pw;

      pc0[0] = pc0[1] = pc0[2] = 0.0;
      pw0[0] = pw0[1] = pw0[2] = 0.0;

      for(i = 0; i < numberOfCorrespondences; i++) {
        pc = 3 * i;
        pw = 3 * i;

        for(j = 0; j < 3; j++) {
          pc0[j] += pcs[pc + j];
          pw0[j] += pws[pw + j];
        }
      }
      for(j = 0; j < 3; j++) {
        pc0[j] /= numberOfCorrespondences;
        pw0[j] /= numberOfCorrespondences;
      }

      var ABt = new Float64Array(3 * 3), 
          ABt_D = new Float64Array(3), 
          ABt_U = new Float64Array(3 * 3), 
          ABt_V = new Float64Array(3 * 3);

      for (i = 0; i < 9; i++) {
        ABt[i] = 0;
      }

      for(i = 0; i < numberOfCorrespondences; i++) {
        pc = 3 * i;
        pw = 3 * i;

        for(j = 0; j < 3; j++) {
          ABt[3 * j    ] += (pcs[pc + j] - pc0[j]) * (pws[pw + 0] - pw0[0]);
          ABt[3 * j + 1] += (pcs[pc + j] - pc0[j]) * (pws[pw + 1] - pw0[1]);
          ABt[3 * j + 2] += (pcs[pc + j] - pc0[j]) * (pws[pw + 2] - pw0[2]);
        }
      }

      instance.svd(ABt, 3, 3, ABt_D, ABt_U, ABt_V);

      for(i = 0; i < 3; i++) {
        for(j = 0; j < 3; j++) {
          R[i*3 + j] = instance.dot(ABt_U, 3 * i, ABt_V, 3 * j);
        }
      }

      var det =
        R[0*3+ 0] * R[1*3+ 1] * R[2*3+ 2] + R[0*3+ 1] * R[1*3+ 2] * R[2*3+ 0] + R[0*3+ 2] * R[1*3+ 0] * R[2*3+ 1] -
        R[0*3+ 2] * R[1*3+ 1] * R[2*3+ 0] - R[0*3+ 1] * R[1*3+ 0] * R[2*3+ 2] - R[0*3+ 0] * R[1*3+ 2] * R[2*3+ 1];

      if (det < 0) {
        R[2*3+ 0] = -R[2*3+ 0];
        R[2*3+ 1] = -R[2*3+ 1];
        R[2*3+ 2] = -R[2*3+ 2];
      }

      t[0] = pc0[0] - instance.dot(R, 0*3, pw0, 0);
      t[1] = pc0[1] - instance.dot(R, 1*3, pw0, 0);
      t[2] = pc0[2] - instance.dot(R, 2*3, pw0, 0);
    };

    tracking.EPnP.prototype.solveForSign = function() {
      var instance = this,
          pcs = instance.pcs,
          ccs = instance.ccs,
          i, 
          j;

      if (pcs[2] < 0.0) {
        for(i = 0; i < 4; i++) {
          for(j = 0; j < 3; j++) {
            ccs[i*3 + j] = -ccs[i*3 + j];
          }
        }

        for(i = 0; i < instance.numberOfCorrespondences; i++) {
          pcs[3 * i    ] = -pcs[3 * i];
          pcs[3 * i + 1] = -pcs[3 * i + 1];
          pcs[3 * i + 2] = -pcs[3 * i + 2];
        }
      }
    };

    tracking.EPnP.prototype.computeRAndT = function(ut, betas, R, t) {
      var instance = this;
      
      instance.computeCCS(betas, ut);
      instance.computePCS();

      instance.solveForSign();

      instance.estimateRAndT(R, t);

      return instance.reprojectionError(R, t);
    };

    tracking.EPnP.prototype.reprojectionError = function(R, t) {
      var instance = this,
          pws = instance.pws,
          dot = instance.dot,
          us = instance.us,
          uc = instance.uc,
          vc = instance.vc,
          fu = instance.fu,
          fv = instance.fv,
          sum2 = 0.0,
          i;

      for(i = 0; i < instance.numberOfCorrespondences; i++) {
        var pw = 3 * i,
            Xc = dot(R, 0*3, pws, pw) + t[0],
            Yc = dot(R, 1*3, pws, pw) + t[1],
            inv_Zc = 1.0 / (dot(R, 2*3, pws, pw) + t[2]),
            ue = uc + fu * Xc * inv_Zc,
            ve = vc + fv * Yc * inv_Zc,
            u = us[2 * i], v = us[2 * i + 1];

        sum2 += Math.sqrt( (u - ue) * (u - ue) + (v - ve) * (v - ve) );
      }

      return sum2 / instance.numberOfCorrespondences;
    };

    // betas10        = [B11 B12 B22 B13 B23 B33 B14 B24 B34 B44]
    // betas_approx_1 = [B11 B12     B13         B14]
    tracking.EPnP.prototype.findBetasApprox1 = function(L_6x10, Rho, betas) {
      var L_6x4 = new Float64Array(6 * 4),
          B4 = new Float64Array(4),
          i;

      for(i = 0; i < 6; i++) {
        L_6x4[i*4 + 0] = L_6x10[i*10 + 0];
        L_6x4[i*4 + 1] = L_6x10[i*10 + 1];
        L_6x4[i*4 + 2] = L_6x10[i*10 + 3];
        L_6x4[i*4 + 3] = L_6x10[i*10 + 6];
      }

      this.solveLinearSystem(L_6x4, 6, 4, Rho, B4);

      if (B4[0] < 0) {
        betas[0] = Math.sqrt(-B4[0]);
        betas[1] = -B4[1] / betas[0];
        betas[2] = -B4[2] / betas[0];
        betas[3] = -B4[3] / betas[0];
      } else {
        betas[0] = Math.sqrt(B4[0]);
        betas[1] = B4[1] / betas[0];
        betas[2] = B4[2] / betas[0];
        betas[3] = B4[3] / betas[0];
      }
    };

    // betas10        = [B11 B12 B22 B13 B23 B33 B14 B24 B34 B44]
    // betas_approx_2 = [B11 B12 B22                            ]
    tracking.EPnP.prototype.findBetasApprox2 = function(L_6x10, Rho, betas) {
      var L_6x3 = new Float64Array(6 * 3), 
          B3 = new Float64Array(3),
          i;

      for(i = 0; i < 6; i++) {
        L_6x3[i*3 + 0] = L_6x10[i*10 + 0];
        L_6x3[i*3 + 1] = L_6x10[i*10 + 1];
        L_6x3[i*3 + 2] = L_6x10[i*10 + 2];
      }

      this.solveLinearSystem(L_6x3, 6, 3, Rho, B3);

      if (B3[0] < 0) {
        betas[0] = Math.sqrt(-B3[0]);
        betas[1] = (B3[2] < 0) ? Math.sqrt(-B3[2]) : 0.0;
      } else {
        betas[0] = Math.sqrt(B3[0]);
        betas[1] = (B3[2] > 0) ? Math.sqrt(B3[2]) : 0.0;
      }

      if (B3[1] < 0) {
        betas[0] = -betas[0];
      }

      betas[2] = 0.0;
      betas[3] = 0.0;
    };

    // betas10        = [B11 B12 B22 B13 B23 B33 B14 B24 B34 B44]
    // betas_approx_3 = [B11 B12 B22 B13 B23                    ]
    tracking.EPnP.prototype.findBetasApprox3 = function(L_6x10, Rho, betas) {
      var L_6x5 = new Float64Array(6 * 5), 
          B5 = new Float64Array(5),
          i;

      for(i = 0; i < 6; i++) {
        L_6x5[i*5 + 0] = L_6x10[i*10 + 0];
        L_6x5[i*5 + 1] = L_6x10[i*10 + 1];
        L_6x5[i*5 + 2] = L_6x10[i*10 + 2];
        L_6x5[i*5 + 3] = L_6x10[i*10 + 3];
        L_6x5[i*5 + 4] = L_6x10[i*10 + 4];
      }

      this.solveLinearSystem(L_6x5, 6, 5, Rho, B5);

      if (B5[0] < 0) {
        betas[0] = Math.sqrt(-B5[0]);
        betas[1] = (B5[2] < 0) ? Math.sqrt(-B5[2]) : 0.0;
      } else {
        betas[0] = Math.sqrt(B5[0]);
        betas[1] = (B5[2] > 0) ? Math.sqrt(B5[2]) : 0.0;
      }
      if (B5[1] < 0) {
        betas[0] = -betas[0];
      }
      betas[2] = B5[3] / betas[0];
      betas[3] = 0.0;
    };

    tracking.EPnP.prototype.computeL6x10 = function(ut, l_6x10) {
      var instance = this,
          v = new Uint8ClampedArray (4),
          i,
          j;

      v[0] = 12 * 11;
      v[1] = 12 * 10;
      v[2] = 12 *  9;
      v[3] = 12 *  8;

      var dv = [new Float64Array(6*3), new Float64Array(6*3), new Float64Array(6*3), new Float64Array(6*3)];

      for(i = 0; i < 4; i++) {
        var a = 0, b = 1;
        for(j = 0; j < 6; j++) {
          dv[i][j*3 + 0] = ut[v[i] + 3 * a    ] - ut[v[i] + 3 * b    ];
          dv[i][j*3 + 1] = ut[v[i] + 3 * a + 1] - ut[v[i] + 3 * b + 1];
          dv[i][j*3 + 2] = ut[v[i] + 3 * a + 2] - ut[v[i] + 3 * b + 2];

          b++;
          if (b > 3) {
            a++;
            b = a + 1;
          }
        }
      }

      for(i = 0; i < 6; i++) {
        l_6x10[10*i + 0] =       instance.dot(dv[0], i*3, dv[0], i*3);
        l_6x10[10*i + 1] = 2.0 * instance.dot(dv[0], i*3, dv[1], i*3);
        l_6x10[10*i + 2] =       instance.dot(dv[1], i*3, dv[1], i*3);
        l_6x10[10*i + 3] = 2.0 * instance.dot(dv[0], i*3, dv[2], i*3);
        l_6x10[10*i + 4] = 2.0 * instance.dot(dv[1], i*3, dv[2], i*3);
        l_6x10[10*i + 5] =       instance.dot(dv[2], i*3, dv[2], i*3);
        l_6x10[10*i + 6] = 2.0 * instance.dot(dv[0], i*3, dv[3], i*3);
        l_6x10[10*i + 7] = 2.0 * instance.dot(dv[1], i*3, dv[3], i*3);
        l_6x10[10*i + 8] = 2.0 * instance.dot(dv[2], i*3, dv[3], i*3);
        l_6x10[10*i + 9] =       instance.dot(dv[3], i*3, dv[3], i*3);
      }
    };

    tracking.EPnP.prototype.computeRho = function(rho) {
      var instance = this,
          cws = instance.cws;

      rho[0] = instance.dist2(cws, 0*3, cws, 1*3);
      rho[1] = instance.dist2(cws, 0*3, cws, 2*3);
      rho[2] = instance.dist2(cws, 0*3, cws, 3*3);
      rho[3] = instance.dist2(cws, 1*3, cws, 2*3);
      rho[4] = instance.dist2(cws, 1*3, cws, 3*3);
      rho[5] = instance.dist2(cws, 2*3, cws, 3*3);
    };

    tracking.EPnP.prototype.computeAAndBGaussNewton = function(l_6x10, Rho, betas, A, b) {
      var i;
      for(i = 0; i < 6; i++) {
        var rowL = l_6x10.subarray(i * 10),
            rowA = A.subarray(i * 4);

        rowA[0] = 2 * rowL[0] * betas[0] +     rowL[1] * betas[1] +     rowL[3] * betas[2] +     rowL[6] * betas[3];
        rowA[1] =     rowL[1] * betas[0] + 2 * rowL[2] * betas[1] +     rowL[4] * betas[2] +     rowL[7] * betas[3];
        rowA[2] =     rowL[3] * betas[0] +     rowL[4] * betas[1] + 2 * rowL[5] * betas[2] +     rowL[8] * betas[3];
        rowA[3] =     rowL[6] * betas[0] +     rowL[7] * betas[1] +     rowL[8] * betas[2] + 2 * rowL[9] * betas[3];

        b[i*1 + 0] = Rho[i]-
          (
            rowL[0] * betas[0] * betas[0] +
            rowL[1] * betas[0] * betas[1] +
            rowL[2] * betas[1] * betas[1] +
            rowL[3] * betas[0] * betas[2] +
            rowL[4] * betas[1] * betas[2] +
            rowL[5] * betas[2] * betas[2] +
            rowL[6] * betas[0] * betas[3] +
            rowL[7] * betas[1] * betas[3] +
            rowL[8] * betas[2] * betas[3] +
            rowL[9] * betas[3] * betas[3]
          );
      }
    };

    tracking.EPnP.prototype.gaussNewton = function(L_6x10, Rho, betas) {
      var iterations_number = 5, 
          A = new Float64Array(6*4), 
          B = new Float64Array(6), 
          X = new Float64Array(4);

      for(var k = 0; k < iterations_number; k++)
      {
        this.computeAAndBGaussNewton(L_6x10, Rho, betas, A, B);
        this.qr_solve(A, 6, 4, B, X);
        for(var i = 0; i < 4; i++) {
          betas[i] += X[i];
        }
      }
    };

    tracking.EPnP.prototype.qr_solve = function(A, m, n, b, X) {
      var instance = this,
          nr = m,
          nc = n,
          i,
          j,
          k,
          ppAij,
          sum, 
          tau;

      if (instance.max_nr < nr)
      {
        instance.max_nr = nr;
        instance.A1 = new Float64Array(nr);
        instance.A2 = new Float64Array(nr);
      }

      var A1 = instance.A1,
          A2 = instance.A2;

      var pA = A, 
          ppAkk = pA;
      for(k = 0; k < nc; k++)
      {
        var ppAik1 = ppAkk,
            eta = Math.abs(ppAik1[0]);
        for(i = k + 1; i < nr; i++)
        {
          var elt = Math.abs(ppAik1[0]);
          if (eta < elt) {
            eta = elt;
          }
          ppAik1 = ppAik1.subarray(nc);
        }
        if (eta === 0)
        {
          A1[k] = A2[k] = 0.0;
          //cerr << "God damnit, A is singular, this shouldn't happen." << endl;
          return;
        }
        else
        {
          var ppAik2 = ppAkk, 
              sum2 = 0.0, 
              inv_eta = 1.0 / eta;
          for(i = k; i < nr; i++)
          {
            ppAik2[0] *= inv_eta;
            sum2 += ppAik2[0] * ppAik2[0];
            ppAik2 = ppAik2.subarray(nc);
          }
          var sigma = Math.sqrt(sum2);
          if (ppAkk[0] < 0) {
            sigma = -sigma;
          }
          ppAkk[0] += sigma;
          A1[k] = sigma * ppAkk[0];
          A2[k] = -eta * sigma;
          for(j = k + 1; j < nc; j++)
          {
            var ppAik = ppAkk;
            sum = 0;
            for(i = k; i < nr; i++)
            {
              sum += ppAik[0] * ppAik[j - k];
              ppAik = ppAik.subarray(nc);
            }
            tau = sum / A1[k];
            ppAik = ppAkk;
            for(i = k; i < nr; i++)
            {
              ppAik[j - k] -= tau * ppAik[0];
              ppAik = ppAik.subarray(nc);
            }
          }
        }
        ppAkk = ppAkk.subarray(nc + 1);
      }

      // b <- Qt b
      var ppAjj = pA,
          pb = b;
      for(j = 0; j < nc; j++)
      {
        ppAij = ppAjj;
        tau = 0;
        for(i = j; i < nr; i++)
        {
          tau += ppAij[0] * pb[i];
          ppAij = ppAij.subarray(nc);
        }
        tau /= A1[j];
        ppAij = ppAjj;
        for(i = j; i < nr; i++)
        {
          pb[i] -= tau * ppAij[0];
          ppAij = ppAij.subarray(nc);
        }
        ppAjj = ppAjj.subarray(nc + 1);
      }

      // X = R-1 b
      var pX = X;
      pX[nc - 1] = pb[nc - 1] / A2[nc - 1];
      for(i = nc - 2; i >= 0; i--)
      {
        ppAij = pA.subarray(i * nc + (i + 1));
        sum = 0;

        for(j = i + 1; j < nc; j++)
        {
          sum += ppAij[0] * pX[j];
          ppAij = ppAij.subarray(1);
        }
        pX[i] = (pb[i] - sum) / A2[i];
      }
    };

    /*
    void epnp::qr_solve(CvMat * A, CvMat * b, CvMat * X)
{
  const int nr = A->rows;
  const int nc = A->cols;

  if (max_nr != 0 && max_nr < nr)
  {
    delete [] A1;
    delete [] A2;
  }
  if (max_nr < nr)
  {
    max_nr = nr;
    A1 = new double[nr];
    A2 = new double[nr];
  }

  double * pA = A->data.db, * ppAkk = pA;
  for(int k = 0; k < nc; k++)
  {
    double * ppAik1 = ppAkk, eta = fabs(*ppAik1);
    for(int i = k + 1; i < nr; i++)
    {
      double elt = fabs(*ppAik1);
      if (eta < elt) eta = elt;
      ppAik1 += nc;
    }
    if (eta == 0)
    {
      A1[k] = A2[k] = 0.0;
      //cerr << "God damnit, A is singular, this shouldn't happen." << endl;
      return;
    }
    else
    {
      double * ppAik2 = ppAkk, sum2 = 0.0, inv_eta = 1. / eta;
      for(int i = k; i < nr; i++)
      {
        *ppAik2 *= inv_eta;
        sum2 += *ppAik2 * *ppAik2;
        ppAik2 += nc;
      }
      double sigma = sqrt(sum2);
      if (*ppAkk < 0)
      sigma = -sigma;
      *ppAkk += sigma;
      A1[k] = sigma * *ppAkk;
      A2[k] = -eta * sigma;
      for(int j = k + 1; j < nc; j++)
      {
        double * ppAik = ppAkk, sum = 0;
        for(int i = k; i < nr; i++)
        {
          sum += *ppAik * ppAik[j - k];
          ppAik += nc;
        }
        double tau = sum / A1[k];
        ppAik = ppAkk;
        for(int i = k; i < nr; i++)
        {
          ppAik[j - k] -= tau * *ppAik;
          ppAik += nc;
        }
      }
    }
    ppAkk += nc + 1;
  }

  // b <- Qt b
  double * ppAjj = pA, * pb = b->data.db;
  for(int j = 0; j < nc; j++)
  {
    double * ppAij = ppAjj, tau = 0;
    for(int i = j; i < nr; i++)
    {
      tau += *ppAij * pb[i];
      ppAij += nc;
    }
    tau /= A1[j];
    ppAij = ppAjj;
    for(int i = j; i < nr; i++)
    {
      pb[i] -= tau * *ppAij;
      ppAij += nc;
    }
    ppAjj += nc + 1;
  }

  // X = R-1 b
  double * pX = X->data.db;
  pX[nc - 1] = pb[nc - 1] / A2[nc - 1];
  for(int i = nc - 2; i >= 0; i--)
  {
    double * ppAij = pA + i * nc + (i + 1), sum = 0;

    for(int j = i + 1; j < nc; j++)
    {
      sum += *ppAij * pX[j];
      ppAij++;
    }
    pX[i] = (pb[i] - sum) / A2[i];
  }
}
     */

    tracking.EPnP.solve = function(objectPoints, imagePoints, cameraMatrix) {
      var R = new Float64Array(3 * 3),
          t = new Float64Array(3),
          EPnP = new tracking.EPnP();

      EPnP.init(objectPoints, imagePoints, cameraMatrix);
      EPnP.computePose(R, t);

      // <DEBUG>
      var s = '';
      for (var i = 0; i < 3; i++) {
        s += '[';
        for (var j = 0; j < 3; j++) {
          s += '\t' + R[i*3+j];
        }
        s += ']\n';
      }
      console.log('R:\n',s);
      console.log('t:', t);
      // </DEBUG> //*/
    };

}());